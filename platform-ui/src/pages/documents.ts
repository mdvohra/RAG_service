import { api, getDefaultCollectionId } from "../api";
import { renderAppLayout, type Me } from "../layouts/AppLayout";
import { el, statusBadge } from "../ui/helpers";
import { showToast } from "../ui/toast";

interface Doc {
  id: string;
  filename: string;
  status: string;
  error_message?: string | null;
  created_at?: string | null;
}

export async function renderDocuments(me: Me) {
  const content = el("div");
  content.append(el("h1", "page-title", "Knowledge base"));

  const zone = el("div", "drop-zone");
  const fileInput = el("input") as HTMLInputElement;
  fileInput.type = "file";
  fileInput.multiple = true;
  fileInput.accept = ".pdf,.txt,.md,.markdown";
  zone.append(el("p", "", "Upload your first document or drag files here"), fileInput);

  zone.addEventListener("dragover", (e) => { e.preventDefault(); });
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files.length) fileInput.files = e.dataTransfer.files;
  });

  const uploadBtn = el("button", "btn btn-primary", "Upload");
  uploadBtn.style.marginTop = "12px";
  uploadBtn.onclick = async () => {
    const files = fileInput.files;
    if (!files?.length) {
      showToast("Select files first", "error");
      return;
    }
    uploadBtn.disabled = true;
    try {
      const cid = await getDefaultCollectionId();
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("metadata", "{}");
        await api(`/collections/${cid}/documents`, { method: "POST", body: fd });
      }
      showToast("Upload complete");
      fileInput.value = "";
      await loadTable(tableHost, cid);
    } catch (e) {
      showToast((e as Error).message, "error");
    }
    uploadBtn.disabled = false;
  };

  content.append(zone, uploadBtn);

  const tableHost = el("div");
  tableHost.style.marginTop = "24px";
  content.appendChild(tableHost);

  try {
    const cid = await getDefaultCollectionId();
    await loadTable(tableHost, cid);
  } catch {
    tableHost.append(el("p", "empty-state", "Could not load documents."));
  }

  return renderAppLayout(me, content, "/app/documents");
}

async function loadTable(host: HTMLElement, collectionId: string) {
  host.innerHTML = "";
  const docs = await api(`/collections/${collectionId}/documents`) as Doc[];
  if (!docs.length) {
    const empty = el("div", "empty-state card");
    empty.append(
      el("p", "", "No documents yet"),
      el("p", "help-text", "Upload PDFs or text files to build your knowledge base.")
    );
    host.appendChild(empty);
    return;
  }

  const table = el("table", "table");
  const thead = el("thead");
  const headRow = el("tr");
  ["Filename", "Status", "Date", "Actions"].forEach((h) => headRow.appendChild(el("th", "", h)));
  thead.appendChild(headRow);

  const tbody = el("tbody");
  docs.forEach((doc) => {
    const tr = el("tr");
    const statusCell = el("td");
    statusCell.innerHTML = `<span class="badge ${statusBadge(doc.status)}">${doc.status}</span>`;
    if (doc.error_message && doc.status === "failed") {
      statusCell.append(el("div", "help-text", doc.error_message));
    }
    const date = doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—";
    const actions = el("td");
    const del = el("button", "btn btn-danger btn-sm", "Delete");
    del.onclick = async () => {
      if (!confirm(`Delete ${doc.filename}?`)) return;
      try {
        await api(`/documents/${doc.id}`, { method: "DELETE" });
        showToast("Deleted");
        await loadTable(host, collectionId);
      } catch (e) {
        showToast((e as Error).message, "error");
      }
    };
    actions.appendChild(del);
    tr.append(el("td", "", doc.filename), statusCell, el("td", "", date), actions);
    tbody.appendChild(tr);
  });

  table.append(thead, tbody);
  host.appendChild(table);
}
