
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { toast } from "sonner";
import { createReactBlockSpec } from "@blocknote/react";
import { BlockNoteEditor, insertOrUpdateBlock } from "@blocknote/core";
import { HiOutlineGlobeAlt } from "react-icons/hi";

// TypeScript Types for Custom Button Block
type ButtonSize = "small" | "medium" | "large";

interface ButtonBlockProps {
  text: string;
  backgroundColor: string;
  textColor: string;
  size: ButtonSize;
}

// Notion-style color palette
export const NotionColors = {
  gray: { bg: "#E8E8E8", text: "#1A1A1A" },
  brown: { bg: "#EDE4DD", text: "#6B4423" },
  orange: { bg: "#FADEC9", text: "#B85C00" },
  yellow: { bg: "#FBF3DB", text: "#7F6C00" },
  green: { bg: "#DDEDEA", text: "#0F7A5C" },
  blue: { bg: "#D3E5EF", text: "#0B5394" },
  purple: { bg: "#E8DEEE", text: "#6940A5" },
  pink: { bg: "#F5E0E9", text: "#AD1A72" },
  red: { bg: "#FFE2DD", text: "#D44C47" },
} as const;


// Custom Button Block Specification
export const buttonBlock = createReactBlockSpec(
  {
    type: "button" as const,
    propSchema: {
      text: {
        default: "Button",
      },
      backgroundColor: {
        default: NotionColors.blue.bg,
      },
      textColor: {
        default: NotionColors.blue.text,
      },
      size: {
        default: "medium" as ButtonSize,
        values: ["small", "medium", "large"] as const,
      },
    },
    content: "none",
  },
  {
    render: (props) => {
      const { block } = props;
      const { text, backgroundColor, textColor, size } = block.props;

      // Size variants - Notion style
      const sizeStyles = {
        small: "h-7 px-3 text-sm",
        medium: "h-8 px-4 text-base",
        large: "h-10 px-5 text-lg",
      };

      const handleClick = () => {
        toast.success(`Button "${text}" clicked!`, {
          description: "This is a custom interactive button block",
        });
        console.log("Button clicked:", {
          text,
          backgroundColor,
          textColor,
          size,
        });
      };

      return (
        <div className="flex items-center py-1">
          <button
            onClick={handleClick}
            className={`
              ${sizeStyles[size as ButtonSize]}
              font-medium
              rounded-md
              transition-all
              duration-200
              hover:opacity-80
              active:scale-95
              cursor-pointer
              border-0
              outline-none
            `}
            style={{
              backgroundColor,
              color: textColor,
            }}
          >
            {text}
          </button>
        </div>
      );
    },
  }
);
// Custom Slash Menu item to insert a button block.
export const insertButtonItem = (editor: BlockNoteEditor<any, any, any>) => ({
  title: "Insert Button",
  onItemClick: () =>
    insertOrUpdateBlock(editor, {
      type: "button",
              props: {
          text: "Action Button",
          backgroundColor: NotionColors.purple.bg,
          textColor: NotionColors.purple.text,
          size: "medium",
        },

    }),
  aliases: ["button"],
  group: "AI",
  icon: <HiOutlineGlobeAlt size={18} />,
  subtext: "Inserts a custom button block.",
});