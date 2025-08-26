import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Upload, Search, FileText } from "lucide-react";
import {
  Dialog,
} from "./dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Group, Idea, TodoSection } from "@shared/schema";

interface TodoListModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | null;
  group: Group | null;
  ideas: Idea[];
  onIdeaUpdate: (ideaId: string, updates: Partial<Idea>) => void;
}

export default function TodoListModal({
  isOpen,
  onClose,
  groupId,
  group,
  ideas,
  onIdeaUpdate,
}: TodoListModalProps) {
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [newSectionName, setNewSectionName] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div
        className="fixed inset-0 z-[1000] flex items-center justify-center"
        style={{
          backgroundColor: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      >
        <div
          className="relative overflow-hidden"
          style={{
            width: "72vw",
            maxWidth: "1120px",
            height: "78vh", 
            maxHeight: "820px",
            borderRadius: "12px",
            backgroundColor: "#ffffff",
            boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
            padding: "24px 24px 16px 24px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center" style={{ gap: "12px" }}>
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  backgroundColor: "#000",
                  borderRadius: "4px",
                }}
              />
              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#1f1f1f",
                  margin: 0,
                }}
              >
                NotebookLM
              </h1>
            </div>
            
            <div className="flex items-center" style={{ gap: "12px" }}>
              {/* Action Pill */}
              <button
                style={{
                  padding: "8px 12px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  backgroundColor: "#EEF4FF",
                  color: "#3B82F6",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#E3EEFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#EEF4FF";
                }}
              >
                <Search style={{ width: "14px", height: "14px" }} />
                Descubrir fuentes
              </button>

              {/* Close Button */}
              <button
                data-testid="button-close-todo-modal"
                onClick={onClose}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6b7280",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F3F4F6";
                  e.currentTarget.style.color = "#111827";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                <X style={{ width: "16px", height: "16px" }} />
              </button>
            </div>
          </div>

          {/* Subtitle */}
          <h2
            style={{
              fontSize: "20px",
              fontWeight: "700",
              marginTop: "12px",
              marginBottom: "12px",
              color: "#1f1f1f",
            }}
          >
            Añadir fuentes
          </h2>

          {/* Body with scrollable content */}
          <div
            style={{
              paddingTop: "12px",
              height: "calc(100% - 120px)",
              overflowY: "auto",
            }}
          >
            {/* Intro Text */}
            <p
              style={{
                fontSize: "14px",
                lineHeight: "1.5",
                color: "#374151",
                marginBottom: "24px",
              }}
            >
              Agrega fuentes de información para que NotebookLM pueda ayudarte a organizar y analizar tus tareas.
            </p>

            {/* Dropzone */}
            <div
              style={{
                height: "240px",
                border: "2px dashed #D1D5DB",
                borderRadius: "12px",
                backgroundColor: "#ffffff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "32px",
              }}
            >
              <Upload
                style={{
                  width: "32px",
                  height: "32px",
                  color: "#6366F1",
                  marginBottom: "8px",
                }}
              />
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#1f2937",
                  marginTop: "8px",
                  marginBottom: "4px",
                }}
              >
                Subir fuentes
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#4b5563",
                  marginBottom: "12px",
                }}
              >
                Arrastra y suelta o selecciona un archivo
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  textAlign: "center",
                  marginTop: "12px",
                }}
              >
                Tipos de archivo admitidos: PDF, txt, Markdown, Audio (por ejemplo, MP3)
              </p>
            </div>

            {/* Sources Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              {/* Google Drive Card */}
              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "16px",
                  backgroundColor: "#ffffff",
                }}
              >
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FileText style={{ width: "16px", height: "16px" }} />
                  Google Drive
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <button
                    style={{
                      height: "28px",
                      padding: "0 10px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      backgroundColor: "#F3F4F6",
                      color: "#111827",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#E5E7EB";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#F3F4F6";
                    }}
                  >
                    <div style={{ width: "4px", height: "4px", backgroundColor: "#4B5563", borderRadius: "50%" }} />
                    Documentos de Google
                  </button>
                  <button
                    style={{
                      height: "28px",
                      padding: "0 10px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      backgroundColor: "#F3F4F6",
                      color: "#111827",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#E5E7EB";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#F3F4F6";
                    }}
                  >
                    <div style={{ width: "4px", height: "4px", backgroundColor: "#4B5563", borderRadius: "50%" }} />
                    Presentaciones de Google
                  </button>
                </div>
              </div>

              {/* Link Card */}
              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "16px",
                  backgroundColor: "#ffffff",
                }}
              >
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Search style={{ width: "16px", height: "16px" }} />
                  Enlace
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <button
                    style={{
                      height: "28px",
                      padding: "0 10px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      backgroundColor: "#F3F4F6",
                      color: "#111827",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#E5E7EB";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#F3F4F6";
                    }}
                  >
                    <div style={{ width: "4px", height: "4px", backgroundColor: "#4B5563", borderRadius: "50%" }} />
                    Sitio web
                  </button>
                  <button
                    style={{
                      height: "28px",
                      padding: "0 10px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      backgroundColor: "#F3F4F6",
                      color: "#111827",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#E5E7EB";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#F3F4F6";
                    }}
                  >
                    <div style={{ width: "4px", height: "4px", backgroundColor: "#4B5563", borderRadius: "50%" }} />
                    YouTube
                  </button>
                </div>
              </div>

              {/* Paste Text Card */}
              <div
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "16px",
                  backgroundColor: "#ffffff",
                }}
              >
                <h4
                  style={{
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#111827",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FileText style={{ width: "16px", height: "16px" }} />
                  Pegar texto
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <button
                    style={{
                      height: "28px",
                      padding: "0 10px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      backgroundColor: "#F3F4F6",
                      color: "#111827",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#E5E7EB";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#F3F4F6";
                    }}
                  >
                    <div style={{ width: "4px", height: "4px", backgroundColor: "#4B5563", borderRadius: "50%" }} />
                    Texto copiado
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "24px",
              right: "24px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              paddingTop: "16px",
              borderTop: "1px solid #E5E7EB",
              backgroundColor: "#ffffff",
            }}
          >
            {/* Left side - Progress */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  fontSize: "13px",
                  color: "#374151",
                }}
              >
                Límite de fuentes
              </span>
              <div
                style={{
                  height: "8px",
                  flex: 1,
                  maxWidth: "120px",
                  backgroundColor: "#E5E7EB",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "0%",
                    backgroundColor: "#C7D2FE",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                }}
              >
                0/300
              </span>
            </div>

            {/* Right side - CTA */}
            <button
              style={{
                height: "40px",
                padding: "0 24px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: "#E5E7EB",
                color: "#9CA3AF",
                border: "none",
                cursor: "not-allowed",
              }}
              disabled
            >
              Sube una fuente para empezar
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}