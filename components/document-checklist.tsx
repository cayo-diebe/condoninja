"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CategoryProgress } from "@/lib/types";
import { FormRequestError, formErrorMessage } from "@/lib/form-errors";
import { DocumentGroup } from "@/components/document-group";

type UploadItem = { name: string; status: "uploading" | "stored" | "duplicate" | "failed"; progress: number; message?: string; file?: File };

export function DocumentChecklist({ initialCategories, onChanged, collapsibleGroups = false }: { initialCategories: CategoryProgress[]; onChanged?: (categories: CategoryProgress[]) => void; collapsibleGroups?: boolean }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [uploads, setUploads] = useState<Record<string, UploadItem[]>>({});
  const [dragging, setDragging] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const dragDepth = useRef<Record<string, number>>({});

  function updateCategories(next: CategoryProgress[]) {
    setCategories(next);
    onChanged?.(next);
    router.refresh();
  }

  function validateClientFile(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const allowed = ["pdf", "doc", "docx", "xls", "xlsx", "csv", "jpg", "jpeg", "png"];
    if (!extension || !allowed.includes(extension)) return "Formato não suportado.";
    if (file.size > 25 * 1024 * 1024) return "O arquivo excede o limite de 25 MB.";
    return null;
  }

  function setUploadItems(categorySlug: string, items: UploadItem[]) {
    setUploads((current) => ({ ...current, [categorySlug]: items }));
  }

  async function upload(categorySlug: string, selectedFiles: File[]) {
    if (categories.find(category => category.slug === categorySlug)?.archived) return;
    setNotice("");
    const valid: File[] = [];
    const initial: UploadItem[] = [];
    for (const file of selectedFiles) {
      const clientError = validateClientFile(file);
      if (clientError) initial.push({ name: file.name, status: "failed", progress: 0, message: clientError, file });
      else { valid.push(file); initial.push({ name: file.name, status: "uploading", progress: 0, file }); }
    }
    setUploadItems(categorySlug, initial);
    if (valid.length === 0) return;

    // Keep the same multi-file picker while uploading one file per request.
    // This prevents large multipart batches exhausting the hosted Worker memory.
    for (const file of valid) {
    const formData = new FormData();
    formData.append("categorySlug", categorySlug);
    formData.append("files", file, file.name);

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/documents");
      xhr.withCredentials = true;
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploads((current) => ({ ...current, [categorySlug]: current[categorySlug]?.map((item) => item.file === file ? { ...item, progress } : item) ?? [] }));
      };
      xhr.onerror = () => {
        setUploads((current) => ({ ...current, [categorySlug]: current[categorySlug]?.map((item) => item.file === file ? { ...item, status: "failed", message: "Falha de conexão. Tente novamente." } : item) ?? [] }));
        resolve();
      };
      xhr.onload = () => {
        let payload: { results?: Array<{ name: string; status: UploadItem["status"]; message?: string }>; categories?: CategoryProgress[] } = {};
        try { payload = JSON.parse(xhr.responseText); } catch { payload = {}; }
        if (xhr.status >= 200 && xhr.status < 300 && payload.results && payload.categories) {
          const result = payload.results[0];
          setUploads(current => ({ ...current, [categorySlug]: current[categorySlug]?.map(item => item.file === file && result ? { ...item, status: result.status, progress: 100, message: result.message } : item) ?? [] }));
          updateCategories(payload.categories);
          const failed = payload.results.filter((result) => result.status === "failed").length;
          setNotice(failed ? "Alguns arquivos não foram salvos. Revise o detalhe e tente novamente." : "Upload confirmado e salvo.");
        } else {
          setUploads((current) => ({ ...current, [categorySlug]: current[categorySlug]?.map((item) => item.file === file ? { ...item, status: "failed", message: payload && "error" in payload ? String(payload.error) : "Não foi possível concluir o upload." } : item) ?? [] }));
        }
        resolve();
      };
      xhr.send(formData);
    });
    }
  }

  function selectFiles(categorySlug: string, files: FileList | File[]) {
    const selected = Array.from(files);
    if (selected.length) void upload(categorySlug, selected);
  }

  async function remove(documentId: string) {
    if (!window.confirm("Remover este documento? Essa ação não pode ser desfeita.")) return;
    try {
      const response = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new FormRequestError(payload.error ?? "Não foi possível remover o documento.");
      const refreshed = await fetch("/api/documents");
      const refreshedPayload = await refreshed.json();
      if (!refreshed.ok) throw new FormRequestError("Não foi possível atualizar a lista de documentos. Atualize a página.");
      updateCategories(refreshedPayload.categories);
    } catch (error) {
      setNotice(formErrorMessage(error, "Não foi possível atualizar os documentos. Verifique sua conexão e tente novamente."));
    }
  }

  const grouped = categories.reduce<Record<string, CategoryProgress[]>>((groups, category) => {
    (groups[category.groupName] ??= []).push(category);
    return groups;
  }, {});

  return (
    <div className="document-checklist">
      <div className="notice"><strong>Para começar:</strong> envie pelo menos um arquivo de cada tipo obrigatório. Para atas e balancetes, reúna os últimos 24 meses, em arquivos separados ou consolidados. A indicação de arquivos recebidos não confirma a cobertura de todo o período. Seus documentos ficam privados e aguardam análise.</div>
      {notice && <div className="form-success" role="status">{notice}</div>}
      {Object.entries(grouped).map(([group, groupCategories]) => <DocumentGroup key={group} name={group} categories={groupCategories} collapsible={collapsibleGroups}>{groupCategories.map((category) => {
        const categoryUploads = uploads[category.slug] ?? [];
        return <article className={`category-card ${dragging === category.slug ? "dragging" : ""}`} key={category.slug}
          onDragEnter={event => { if (category.archived || !Array.from(event.dataTransfer.types).includes("Files")) return; event.preventDefault(); dragDepth.current[category.slug] = (dragDepth.current[category.slug] ?? 0) + 1; setDragging(category.slug); }}
          onDragOver={event => { if (Array.from(event.dataTransfer.types).includes("Files")) { event.preventDefault(); event.dataTransfer.dropEffect = category.archived ? "none" : "copy"; } }}
          onDragLeave={event => { event.preventDefault(); dragDepth.current[category.slug] = Math.max(0, (dragDepth.current[category.slug] ?? 0) - 1); if (!dragDepth.current[category.slug]) setDragging(current => current === category.slug ? null : current); }}
          onDrop={event => { event.preventDefault(); dragDepth.current[category.slug] = 0; setDragging(null); if (!category.archived) selectFiles(category.slug, event.dataTransfer.files); }}>
          <div className="category-head">
            <div className="category-title"><span className={`document-light ${category.documents.length > 0 ? "received" : category.required ? "required-pending" : "optional-pending"}`} role="img" aria-label={category.documents.length > 0 ? "Documento recebido" : category.required ? "Documento obrigatório pendente" : "Documento opcional não enviado"} /><div><h4><button type="button" className="category-toggle" aria-expanded={Boolean(expanded[category.slug])} aria-controls={`document-info-${category.slug}`} onClick={() => setExpanded(current => ({ ...current, [category.slug]: !current[category.slug] }))}><span className="category-toggle-arrow" aria-hidden="true">{expanded[category.slug] ? "▾" : "▸"}</span>{category.label}</button></h4><span className={category.required ? "required-label" : "recommended-label"}>{category.archived ? "Arquivo anterior" : category.required ? "Obrigatório" : "Recomendado"}</span></div></div>
            {!category.archived && <div className="category-upload-control"><span>Arraste arquivos aqui ou</span><button type="button" className="button button-secondary" aria-label={`Selecionar arquivos para ${category.label}`} onClick={() => inputRefs.current[category.slug]?.click()}>selecione do dispositivo</button></div>}
          </div>
          <div className={`category-info ${expanded[category.slug] ? "is-open" : ""}`} id={`document-info-${category.slug}`} aria-hidden={!expanded[category.slug]} inert={!expanded[category.slug]}><div className="category-info-inner"><p>{category.description}</p><p>{category.whyRequired}</p></div></div>
          {category.documents.length > 0 && <div className="document-list">{category.documents.map((document) => <div className="document-row" key={document.id}><span className="document-filename" title={document.originalName}>{document.originalName}</span><div className="document-actions"><button type="button" className="button button-danger" onClick={() => void remove(document.id)}>Remover</button></div></div>)}</div>}
            {!category.archived && <input className="file-input" ref={(element) => { inputRefs.current[category.slug] = element; }} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png" onChange={(event) => { if (event.target.files) selectFiles(category.slug, event.target.files); event.target.value = ""; }} />}
          {categoryUploads.length > 0 && <div className="upload-progress">{categoryUploads.map((item, index) => <div className={`upload-item ${item.status === "failed" ? "upload-error" : ""}`} key={`${item.name}-${index}`}><span>{item.name}{item.status === "uploading" ? ` · ${item.progress}%` : item.message ? ` · ${item.message}` : item.status === "duplicate" ? " · já enviado" : " · salvo"}</span>{item.status === "failed" && item.file && <button className="button button-quiet" style={{ minHeight: 25, padding: 0, fontSize: 12 }} onClick={() => void upload(category.slug, [item.file!])}>Tentar novamente</button>}</div>)}</div>}
        </article>;
      })}</DocumentGroup>)}
    </div>
  );
}
