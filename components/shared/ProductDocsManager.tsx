"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { FileText, Upload, X } from "lucide-react";

import { useProductDocsStore } from "@/lib/store/product-docs";
import { cn } from "@/lib/utils";

interface ProductDocsManagerProps {
  variant?: "onboarding" | "settings";
}

export function ProductDocsManager({ variant = "onboarding" }: ProductDocsManagerProps) {
  const { docs, addDoc, removeDoc } = useProductDocsStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        void import("@/lib/api-client")
          .then(async ({ api }) => {
            const doc = await api.uploadProductDoc(file);
            addDoc(doc);
            toast.success(`"${file.name}" added`);
          })
          .catch(() => {
            addDoc({
              name: file.name,
              size: `${(file.size / 1024).toFixed(0)} KB`,
              type: file.type,
            });
            toast.message(`"${file.name}" saved locally — file storage is not configured`);
          });
      });
    },
    [addDoc]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/markdown": [".md"],
      "text/plain": [".txt"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  const isSettings = variant === "settings";

  return (
    <div className={cn("space-y-4", isSettings && "space-y-5")}>
      {!isSettings && (
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Help the agent understand your product</h1>
          <p className="text-muted-foreground text-sm">
            Upload product docs, FAQs, known issues, or specs to improve draft quality.{" "}
            <span className="text-muted-foreground/70">(Optional)</span>
          </p>
        </div>
      )}

      {isSettings && (
        <div>
          <h3 className="text-sm font-semibold">Product Documentation</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Upload or remove docs the agent uses for ticket analysis. Changes are re-indexed automatically.
          </p>
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl text-center cursor-pointer transition-colors",
          isSettings ? "p-6" : "p-10",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/20"
        )}
      >
        <input {...getInputProps()} />
        <Upload
          className={cn(
            "mx-auto mb-3",
            isSettings ? "size-6" : "size-8",
            isDragActive ? "text-primary" : "text-muted-foreground"
          )}
        />
        <p className={cn("font-medium text-foreground", isSettings ? "text-sm" : "text-sm")}>
          {isDragActive ? "Drop files here…" : "Drag & drop files, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">PDF, MD, TXT, DOCX · Max 50 MB each</p>
        {!isSettings && (
          <p className="text-xs text-muted-foreground mt-1 italic">
            e.g. Product docs, FAQs, internal wikis, known issues, feature specs
          </p>
        )}
      </div>

      {docs.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Uploaded ({docs.length})
          </p>
          {docs.map((doc) => (
            <div key={doc.name} className="flex items-center gap-2.5 p-3 rounded-lg border bg-muted/20">
              <FileText className="size-4 text-muted-foreground shrink-0" />
              <span className="text-sm flex-1 truncate">{doc.name}</span>
              <span className="text-xs text-muted-foreground">{doc.size}</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-red-600 transition-colors"
                onClick={() => {
                  const match = docs.find((d) => d.name === doc.name);
                  if (match?.id) {
                    void import("@/lib/api-client").then(({ api }) =>
                      api.deleteProductDoc(match.id!).catch(() => undefined),
                    );
                  }
                  removeDoc(doc.name);
                  toast.info(`"${doc.name}" removed`);
                }}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isSettings && docs.length === 0 && (
        <p className="text-sm text-muted-foreground">No product docs uploaded yet.</p>
      )}
    </div>
  );
}
