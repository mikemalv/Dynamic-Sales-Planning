import { NextResponse } from "next/server";

const ACCOUNT = process.env.SNOWFLAKE_ACCOUNT || "SFSENORTHAMERICA-DEMO_MMALVEIRA";
const PAT_TOKEN = process.env.SNOWFLAKE_PAT || "";

function logCurlCommand(model: string, messages: { role: string; content: string }[]) {
  const payload = {
    model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    temperature: 0,
    top_p: 1
  };

  const curl = `
================================================================================
CORTEX REST API - CURL COMMAND
================================================================================
curl -X POST \\
  "https://${ACCOUNT}.snowflakecomputing.com/api/v2/cortex/inference:complete" \\
  -H "Authorization: Bearer ${PAT_TOKEN.substring(0, 20)}...${PAT_TOKEN.substring(PAT_TOKEN.length - 10)}" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '${JSON.stringify(payload, null, 2)}'
================================================================================
`;
  console.log(curl);
}

export async function POST(request: Request) {
  try {
    const { messages, model = "claude-sonnet-4-5" } = await request.json();

    if (!PAT_TOKEN) {
      return NextResponse.json(
        { error: "SNOWFLAKE_PAT environment variable is not set" },
        { status: 500 }
      );
    }

    logCurlCommand(model, messages);

    const apiUrl = `https://${ACCOUNT}.snowflakecomputing.com/api/v2/cortex/inference:complete`;
    
    const payload = {
      model,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content
      })),
      temperature: 0,
      top_p: 1
    };

    console.log("\n🚀 Calling Cortex REST API...\n");

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAT_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "X-Snowflake-Authorization-Token-Type": "PROGRAMMATIC_ACCESS_TOKEN"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Cortex API error:", response.status, errorText);
      return NextResponse.json(
        { error: `Cortex API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const responseText = await response.text();
    console.log("\n📥 Raw response:\n", responseText.substring(0, 500), "...\n");

    let fullContent = "";
    const lines = responseText.split("\n");
    
    for (const line of lines) {
      if (line.startsWith("data:")) {
        const jsonStr = line.replace(/^data:\s*/, "").trim();
        if (jsonStr && jsonStr !== "[DONE]") {
          try {
            const data = JSON.parse(jsonStr);
            const deltaContent = data.choices?.[0]?.delta?.content;
            if (deltaContent) {
              fullContent += deltaContent;
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      }
    }

    console.log("\n✅ Full response content:\n", fullContent.substring(0, 200), "...\n");

    return NextResponse.json({ content: fullContent || "No response from model" });

  } catch (error) {
    console.error("Error in cortex-chat:", error);
    return NextResponse.json(
      { error: `Failed to process chat request: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
