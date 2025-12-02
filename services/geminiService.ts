import { GoogleGenAI, Chat } from "@google/genai";
import type { TutorConfigData } from "../types";

// Assume process.env.API_KEY is available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const fileToGenerativePart = (base64: string, mimeType: string) => {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
};

export const extractProblemFromImage = async (imageBase64: string, mimeType: string): Promise<string> => {
    try {
        const imagePart = fileToGenerativePart(imageBase64, mimeType);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, { text: "इस छवि में दिखाए गए प्रश्न को निकालें और उसे स्पष्ट रूप से सादे पाठ प्रारूप में प्रस्तुत करें, बिना किसी मार्कडाउन या विशेष स्वरूपण के।" }] },
        });
        return response.text || "छवि से पाठ नहीं निकाला जा सका।";
    } catch (error) {
        console.error("Error extracting problem from image:", error);
        return "माफ़ कीजिए, मुझे चित्र में दिया गया प्रश्न समझ नहीं आया। कृपया कोई दूसरा प्रयास करें।";
    }
};

let chatSession: Chat | null = null;

const createSystemInstruction = (context: TutorConfigData, problem: string): string => {
  return `You are 'Navodaya Mitra', a compassionate, patient, and friendly AI tutor for students preparing for the Jawahar Navodaya Vidyalaya (JNV) entrance exam. Your student is preparing for: "${context.level}". Your goal is to guide them to the solution, not give it to them.

The problem to solve is: "${problem}"

Follow these rules strictly:
1.  **Language:** You MUST respond ONLY in simple, easy-to-understand Hindi. Use Devanagari script.
2.  **Core Interaction:** Start by providing ONLY the very first conceptual step to solve the problem. Do not perform calculations or reveal formulas in the first step. Just explain the approach in simple Hindi. Wait for the student's response, then provide the next single, small step.
3.  **Socratic Method:** If the student asks "क्यों?", "यह कैसे हुआ?", "समझाओ", or a similar question, you must explain the reasoning behind the *most recent* step you provided in very simple terms. After explaining, ask them if they are ready to proceed (e.g., "क्या अब हम आगे बढ़ें?").
4.  **No Spoilers:** Never, under any circumstances, reveal the final answer or multiple steps at once. Guide them until THEY arrive at the solution.
5.  **Subject Adaptability:** Adapt your guidance to the subject. For Mental Ability, explain the logic pattern. For Math, explain the calculation steps. For Science, explain the core concepts.
6.  **Visuals:** For problems involving geometry, graphs, or shapes, use markdown, ASCII art, or detailed textual descriptions in Hindi to create a mental image for the student.
7.  **Tone:** Maintain a patient, encouraging, and friendly tone ("शाबाश!", "बहुत अच्छे!", "कोशिश करते रहो!"). Use emojis where appropriate.
8.  **First Response:** Do not greet the user in your first response. Immediately provide the first step in Hindi.
9.  **Formatting:** Use markdown for mathematical expressions, for example: \`x^2 + 2x - 1 = 0\`.
10. **Completion Signal:** When the student has successfully solved the entire problem, your *very last* message must end with the special token: \`[SOLVED]\`.
11. **Practice Problem Command:** If the user asks for another practice problem, you must respond with ONLY the new problem statement in Hindi, formatted like this: \`[NEW_PROBLEM]आपका नया प्रश्न है: ...[/NEW_PROBLEM]\`. Do not add any other text.
`;
};


export const startTutorChat = async (context: TutorConfigData, problem: string): Promise<string> => {
    const systemInstruction = createSystemInstruction(context, problem);
    
    chatSession = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
            systemInstruction: systemInstruction,
            thinkingConfig: { thinkingBudget: 16384 } // Adjusted budget for performance/latency balance
        },
    });

    try {
        const response = await chatSession.sendMessage({ message: "Let's begin." });
        return response.text || "नमस्ते! चलिए शुरू करते हैं।";
    } catch (error) {
        console.error("Error starting chat:", error);
        return "पहला कदम तैयार करने में कुछ समस्या हुई। कृपया प्रश्न को फिर से अपलोड करने का प्रयास करें।";
    }
};

export const continueTutorChat = async (userMessage: string): Promise<string> => {
    if (!chatSession) {
        return "कोई सक्रिय ट्यूटरिंग सत्र नहीं है। कृपया पहले एक प्रश्न अपलोड करें।";
    }
    try {
        const response = await chatSession.sendMessage({ message: userMessage });
        return response.text || "मुझे खेद है, मैं जवाब नहीं दे पाया।";
    } catch (error) {
        console.error("Error in chat session:", error);
        return "मुझे एक समस्या का सामना करना पड़ा। कृपया अपना संदेश फिर से भेजने का प्रयास करें।";
    }
};