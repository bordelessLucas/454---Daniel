import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { sanitizeTipTapHtmlInput } from "@/lib/sanitize-tip-tap-html";

const editorContentClassName =
  "w-full text-sm text-foreground outline-none " +
  "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 " +
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 " +
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 " +
  "[&_a]:text-primary [&_a]:underline [&_h1]:text-base [&_h1]:font-semibold " +
  "[&_h2]:text-sm [&_h2]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3";

interface RichTextReadonlyProps {
  html: string;
  className?: string;
}

export function RichTextReadonly({ html, className }: RichTextReadonlyProps) {
  const safeHtml = sanitizeTipTapHtmlInput(html);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        autolink: false,
        linkOnPaste: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: safeHtml,
    editable: false,
    editorProps: {
      attributes: {
        class: editorContentClassName,
        "aria-readonly": "true",
      },
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }
    editor.commands.setContent(sanitizeTipTapHtmlInput(html), {
      emitUpdate: false,
    });
  }, [editor, html]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={
        className ??
        "text-sm [&_.ProseMirror]:min-h-0 [&_.ProseMirror]:outline-none"
      }
    >
      <EditorContent editor={editor} />
    </div>
  );
}
