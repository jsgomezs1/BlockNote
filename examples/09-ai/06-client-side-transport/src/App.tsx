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
} from "@blocknote/xl-ai";
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
