import { BlockNoteEditor, BlockNoteSchema, defaultBlockSpecs, filterSuggestionItems } from "@blocknote/core";
import "@blocknote/core/fonts/inter.css";
import { en } from "@blocknote/core/locales";
import { BlockNoteView } from "@blocknote/mantine";
import { createGroq } from "@ai-sdk/groq";
import "@blocknote/mantine/style.css";
import {
  FormattingToolbar,
  FormattingToolbarController,
  getDefaultReactSlashMenuItems,
  getFormattingToolbarItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from "@blocknote/react";
import {
  AIMenuController,
  AIToolbarButton,
  ClientSideTransport,
  createAIExtension,
  getAISlashMenuItems,
  defaultAIRequestSender,
  aiDocumentFormats,
} from "@blocknote/xl-ai";
import type { PromptBuilder } from "@blocknote/xl-ai";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import "@blocknote/xl-ai/style.css";
import { buttonBlock, insertButtonItem, NotionColors } from "./custom-button";

// We define the model directly in our app using the Vercel AI SDK
// Using direct API calls without proxy server for development
const groqApiKey = (import.meta as any).env?.VITE_GROQ_API_KEY;

if (!groqApiKey) {
  console.error("VITE_GROQ_API_KEY environment variable is not set. Please create a .env file with your Groq API key.");
}

const model = createGroq({
  apiKey: groqApiKey || "", // Get API key from environment variables
})("llama-3.3-70b-versatile");

// Create custom schema with button block
const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    button: buttonBlock(),
  },
});

// Custom prompt builder to teach the AI about button blocks
const customPromptBuilder: PromptBuilder<any> = async (messages, inputData) => {
  // First, call the default HTML prompt builder to set up the document state
  await aiDocumentFormats.html.defaultPromptBuilder(messages, inputData);
  
  const colorPalette = Object.entries(NotionColors)
    .map(([name, colors]) => `  - ${name}: backgroundColor="${colors.bg}", textColor="${colors.text}"`)
    .join('\n');

  // Now append our custom button instructions to the system message
  const existingSystemMsg = messages.find(m => m.role === "system");
  
  const buttonInstructions = `

CRITICAL BLOCK REFERENCE RULES:
1. ALWAYS examine the document state carefully to find valid block IDs
2. Block IDs are shown in the HTML as id="SOME_ID$" - you MUST use these exact IDs
3. When using the "add" operation, the referenceId MUST be an actual block ID from the document
4. NEVER make up or guess block IDs - only use IDs you see in the document HTML
5. Common pattern: Use the ID of the last block in the document and position="after"

Example of finding a valid referenceId:
If the document contains: <p id="abc123$">Some text</p>
Then use referenceId: "abc123$" with position: "after"

CUSTOM BUTTON BLOCK SUPPORT:
You can create custom button blocks using HTML div elements with special data attributes.

BUTTON HTML FORMAT:
<div data-content-type="button" data-text="Button Text" data-bg-color="#HEXCODE" data-text-color="#HEXCODE" data-size="medium">Button Text</div>

Required Attributes:
  - data-content-type="button" (identifies this as a button block)
  - data-text: The button label text
  - data-bg-color: Background color (hex code)
  - data-text-color: Text color (hex code)
  - data-size: "small" | "medium" | "large"

AVAILABLE COLORS (use these exact hex values):
${colorPalette}

SIZE GUIDELINES:
  - small: Compact buttons, secondary actions (keywords: small, tiny, compact)
  - medium: Default size for standard buttons (keywords: medium, regular, normal, standard)
  - large: Prominent CTAs, primary actions (keywords: large, big, prominent)

SEMANTIC COLOR MAPPING:
  - Submit, Save, Proceed, Continue, Success → green (#DDEDEA bg, #0F7A5C text)
  - Delete, Remove, Cancel, Danger, Error → red (#FFE2DD bg, #D44C47 text)
  - Edit, Update, Modify, Info, Default → blue (#D3E5EF bg, #0B5394 text)
  - Warning, Alert, Caution → orange (#FADEC9 bg, #B85C00 text) or yellow (#FBF3DB bg, #7F6C00 text)
  - Settings, Options, Secondary → purple (#E8DEEE bg, #6940A5 text) or gray (#E8E8E8 bg, #1A1A1A text)

EXAMPLES:
User: "Create a button that says Submit"
→ <div data-content-type="button" data-text="Submit" data-bg-color="#DDEDEA" data-text-color="#0F7A5C" data-size="medium">Submit</div>

User: "Add a large red button labeled Delete"
→ <div data-content-type="button" data-text="Delete" data-bg-color="#FFE2DD" data-text-color="#D44C47" data-size="large">Delete</div>

User: "Create a small blue button saying Help"
→ <div data-content-type="button" data-text="Help" data-bg-color="#D3E5EF" data-text-color="#0B5394" data-size="small">Help</div>

COMPLETE ADD OPERATION EXAMPLE:
Given document state with block: <p id="xyz789$">Welcome</p>
To add a button after it:
{
  "type": "add",
  "referenceId": "xyz789$",
  "position": "after",
  "blocks": [
    "<div data-content-type=\"button\" data-text=\"Submit\" data-bg-color=\"#DDEDEA\" data-text-color=\"#0F7A5C\" data-size=\"medium\">Submit</div>"
  ]
}

CRITICAL RULES:
1. ALWAYS use the exact HTML format shown above with all data attributes
2. When using the add operation, ALWAYS use a valid block ID from the document that ends with $
3. Extract the button text from the user's prompt (look for quotes, "that says", "labeled", etc.)
4. Identify color keywords and map to the exact hex values from the color palette
5. Detect size keywords (small/large) or use "medium" as default
6. Use semantic mapping for action-oriented text (Save→green, Delete→red, etc.)
7. The text content inside the div should match the data-text attribute`;

  if (existingSystemMsg && existingSystemMsg.parts && existingSystemMsg.parts[0]) {
    // Append to existing system message if it's a text part
    const firstPart = existingSystemMsg.parts[0];
    if (firstPart.type === "text" && "text" in firstPart) {
      firstPart.text += buttonInstructions;
    }
  } else {
    // Add new system message at the beginning
    messages.unshift({
      role: "system",
      id: "button-block-instructions",
      parts: [
        {
          type: "text",
          text: buttonInstructions,
        },
      ],
    });
  }
};

export default function App() {
  // Creates a new editor instance.
  const editor = useCreateBlockNote({
    schema,
    dictionary: {
      ...en,
      ai: aiEn, // add default translations for the AI extension
    },
    initialContent: [
      {
        type: "heading",
        content: "Welcome to AI-Powered Notes",
      },
 
      // Example 1: Blue button (default, medium size)
      {
        type: "button",
        props: {
          text: "Click Me!",
          backgroundColor: NotionColors.blue.bg,
          textColor: NotionColors.blue.text,
          size: "medium",
        },
      },
      // Example 2: Green button (large size)
      {
        type: "button",
        props: {
          text: "Large Green Button",
          backgroundColor: NotionColors.green.bg,
          textColor: NotionColors.green.text,
          size: "large",
        },
      },
      // Example 3: Red button (small size)
      {
        type: "button",
        props: {
          text: "Small Alert",
          backgroundColor: NotionColors.red.bg,
          textColor: NotionColors.red.text,
          size: "small",
        },
      },
      // Example 4: Purple button (medium size)
      {
        type: "button",
        props: {
          text: "Action Button",
          backgroundColor: NotionColors.purple.bg,
          textColor: NotionColors.purple.text,
          size: "medium",
        },
      },
            {
        type: "paragraph",
        props: {
          content:"",
        },
      },

    ],
    // Register the AI extension
    extensions: [
      createAIExtension({
        // The ClientSideTransport is used so the client makes calls directly to `streamText`
        // (whereas normally in the Vercel AI SDK, the client makes calls to your server, which then calls these methods)
        // (see https://github.com/vercel/ai/issues/5140 for background info)
        transport: new ClientSideTransport({
          model,
        }),
        // Custom stream tools provider to convert HTML button representations to button blocks
        streamToolsProvider: aiDocumentFormats.html.getStreamToolsProvider({
          withDelays: true,
          defaultStreamTools: {
            add: true,
            update: true,
            delete: true,
          },
        }),
        // Use HTML format with custom prompt builder
        aiRequestSender: defaultAIRequestSender(
          customPromptBuilder,
          aiDocumentFormats.html.defaultPromptInputDataBuilder
        ),
      }),
    ],
    // We set some initial content for demo purposes

  });

  // Renders the editor instance using a React component.
  return (
    <div className="relative h-full p-11">
            <style>{`
        /* Remove blue outline from ProseMirror selected nodes - CRITICAL RULE */
        .bn-block-content.ProseMirror-selectednode > *,
        .ProseMirror-selectednode > .bn-block-content > * {
          outline: none !important;
          border-radius: 0 !important;
        }
      `}</style>
      <BlockNoteView
        editor={editor}
        // We're disabling some default UI elements
        formattingToolbar={false}
        slashMenu={false}
      >
        {/* Add the AI Command menu to the editor */}
        <AIMenuController />

        {/* We disabled the default formatting toolbar with `formattingToolbar=false` 
        and replace it for one with an "AI button" (defined below). 
        (See "Formatting Toolbar" in docs)
        */}
        <FormattingToolbarWithAI />

        {/* We disabled the default SlashMenu with `slashMenu=false` 
        and replace it for one with an AI option (defined below). 
        (See "Suggestion Menus" in docs)
        */}
        <SuggestionMenuWithAI editor={editor} />
      </BlockNoteView>
    </div>
  );
}

// Formatting toolbar with the `AIToolbarButton` added
function FormattingToolbarWithAI() {
  return (
    <FormattingToolbarController
      formattingToolbar={() => (
        <FormattingToolbar>
          {...getFormattingToolbarItems()}
          {/* Add the AI button */}
          <AIToolbarButton />
        </FormattingToolbar>
      )}
    />
  );
}

// Slash menu with the AI option added
function SuggestionMenuWithAI(props: {
  editor: BlockNoteEditor<any, any, any>;
}) {
  return (
    <SuggestionMenuController
      triggerCharacter="/"
      getItems={async (query) =>
        filterSuggestionItems(
          [
            ...getDefaultReactSlashMenuItems(props.editor),
            insertButtonItem(props.editor),
            // add the default AI slash menu items, or define your own
            ...getAISlashMenuItems(props.editor),
          ],
          query,
        )
      }
    />
  );
}
