import { Resend } from "resend";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { supabase } from "../../../lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

export const runtime = "nodejs";

export async function POST(request: Request) {

  console.log("SUPABASE URL:", process.env.SUPABASE_URL);
  console.log("SUPABASE KEY:", process.env.SUPABASE_ANON_KEY?.slice(0, 10));

  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      newsletterConsent,
      model,
      finalTotal,
      summary,
      image,
    } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const summaryHtml = Array.isArray(summary)
      ? summary.map((item) => `<li>${item}</li>`).join("")
      : "";

      let imageUrl = null;

// 1️⃣ Upload image FIRST
if (image) {
  const base64Data = image.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const blob = await put(`design-${Date.now()}.png`, buffer, {
    access: "public",
  });

  imageUrl = blob.url;
}

// 2️⃣ THEN insert ONCE
const { data, error } = await supabase
  .from("leads")
  .insert([
    {
      first_name: firstName || null,
      last_name: lastName || null,
      email,
      phone: phone || null,
      newsletter: newsletterConsent || false,
      model,
      final_total: finalTotal ? Number(finalTotal) : null,
      summary: Array.isArray(summary) ? summary.join(", ") : null,
      image_url: imageUrl,
    },
  ])
  .select();

// 🔥 ADD THIS (you probably missed this step)
console.log("SUPABASE DATA:", data);
console.log("SUPABASE ERROR:", error);

if (error) {
  console.error("INSERT FAILED:", error.message);
}

console.log("IMAGE URL:", imageUrl);

    await resend.emails.send({
      from: "ZerroMax <design@mail.zerromax.com>",
      to: email,
      replyTo: "savedesign@zerromax.com", 
      subject: `Your ZerroMax design - ${model}`,
      html: `
<div style="margin:0;padding:0;background:#0b0b0b;font-family:'Poppins',Arial,sans-serif;">
  
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        
        <table width="600" cellpadding="0" cellspacing="0" style="padding:40px;">
          
          <!-- LOGO (CENTERED) -->
          <tr>
            <td align="center">
              <img 
                src="https://vhm6lp9s4ppp8zur.public.blob.vercel-storage.com/logo-white.svg"
                alt="ZerroMax"
                style="width:150px;margin-bottom:30px;"
              />
            </td>
          </tr>

          ${imageUrl ? `
<tr>
  <td align="center">
    <img 
      src="${imageUrl}"
      alt="Your design"
      style="width:100%;max-width:520px;border-radius:10px;"
    />
  </td>
</tr>
` : ""}

          <!-- CONTENT (LEFT ALIGNED) -->
          <tr>
            <td style="padding-top:30px;text-align:left;">
              
              <h1 style="margin:0;font-size:28px;color:#ffffff;">
                ${model}
              </h1>

              <p style="color:#aaa;margin-top:10px;">
                Your saved configuration
              </p>

              <ul style="
                margin-top:20px;
                padding-left:20px;
                color:#ccc;
                line-height:1.6;
              ">
                ${summaryHtml}
              </ul>

            </td>
          </tr>

          <!-- PRICE -->
          <tr>
            <td style="padding-top:20px;text-align:left;">
              <p style="font-size:22px;font-weight:600;color:#ffffff;">
                €${finalTotal.toLocaleString("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}
              </p>
            </td>
          </tr>

          <!-- BUTTONS (CENTERED) -->
          <tr>
            <td align="center" style="padding-top:30px;">
              
              <!-- PRIMARY -->
              <a href="tel:+386XXXXXXXX"
                 style="
                   display:block;
                   width:100%;
                   max-width:320px;
                   background:#c8b299;
                   color:#000;
                   text-decoration:none;
                   padding:14px;
                   border-radius:8px;
                   font-weight:600;
                   margin-bottom:10px;
                   text-align:center;
                 ">
                Call for viewing
              </a>

              <!-- SECONDARY -->
              <a href="mailto:info@zerromax.com"
                 style="
                   display:block;
                   width:100%;
                   max-width:320px;
                   border:1px solid #444;
                   color:#ccc;
                   text-decoration:none;
                   padding:14px;
                   border-radius:8px;
                   text-align:center;
                 ">
                Request offer
              </a>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding-top:40px;font-size:12px;color:#666;text-align:left;">
              ZerroMax © ${new Date().getFullYear()}
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</div>
`,
    });

    await resend.emails.send({
      from: "ZerroMax <design@mail.zerromax.com>",
      to: "savedesign@zerromax.com",
      subject: `New ZerroMax lead - ${model}`,
      html: `
        <h1>New lead</h1>

        <p><strong>Name:</strong> ${firstName || ""} ${lastName || ""}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || ""}</p>
        <p><strong>Newsletter:</strong> ${newsletterConsent ? "Yes" : "No"}</p>

        <h2>${model}</h2>
        <p><strong>Final total:</strong> €${finalTotal}</p>

        <h3>Configuration summary</h3>
        <ul>${summaryHtml}</ul>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save design error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}