
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

      // Size variants - Notion style (converted to inline styles)
      const sizeStyles = {
        small: {
          height: "28px",
          paddingLeft: "12px",
          paddingRight: "12px",
          fontSize: "14px",
        },
        medium: {
          height: "32px",
          paddingLeft: "16px",
          paddingRight: "16px",
          fontSize: "16px",
        },
        large: {
          height: "40px",
          paddingLeft: "20px",
          paddingRight: "20px",
          fontSize: "18px",
        },
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
        <div style={{ display: "flex", alignItems: "center", paddingTop: "4px", paddingBottom: "4px" }}>
          <button
            onClick={handleClick}
            style={{
              ...sizeStyles[size as ButtonSize],
              backgroundColor,
              color: textColor,
              fontWeight: "500",
              borderRadius: "6px",
              transition: "all 0.2s",
              cursor: "pointer",
              border: "none",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = "scale(0.95)";
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
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