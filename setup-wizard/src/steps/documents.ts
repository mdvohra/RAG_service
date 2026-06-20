import { getDefaultCollection, uploadDocument } from "../api";
import { getConfig, getState, patchState } from "../state";
import { el, showToast } from "../ui/helpers";

export function renderDocumentsStep(container: HTMLElement, onNext: () => void) {
  const config = getConfig();
  container.innerHTML = "";
  const h2 = el("h2");
  h2.textContent = "Upload documents";
  const p = el("p", "step-desc");
  p.textContent = "Add PDF, TXT, or Markdown files. Processing runs in the background.";

  const zone = el("div", "upload-zone");
  zone.id = "uploadZone";
  const fileInput = el("input") as HTMLInputElement;
  fileInput.type = "file";
  fileInput.multiple = true;
  fileInput.accept = ".pdf,.txt,.md,.markdown";
  const zoneHint = el("p");
  zoneHint.style.cssText = "margin:12px 0 0;font-size:13px;color:var(--rag-text-muted)";
  zoneHint.textContent = "or drag files here";
  zone.append(fileInput, zoneHint);

  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("drag");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("drag");
    if (e.dataTransfer?.files.length) fileInput.files = e.dataTransfer.files;
  });

  const status = el("div");
  const adminLink = el("p", "step-desc");
  adminLink.innerHTML = `Manage documents anytime at <a href="${config.adminUrl}" target="_blank">${config.adminUrl}</a>.`;

  const btnUpload = el("button", "btn");
  btnUpload.textContent = "Upload selected";
  btnUpload.onclick = async () => {
    const files = fileInput.files;
    if (!files?.length) {
      showToast("Select files first");
      return;
    }
    btnUpload.disabled = true;
    try {
      let cid = getState().collectionId;
      if (!cid) {
        cid = await getDefaultCollection(config);
        patchState({ collectionId: cid });
      }
      for (const file of files) {
        await uploadDocument(config, cid!, file);
      }
      patchState({ documentsUploaded: true });
      status.textContent = `Uploaded ${files.length} file(s). Processing in background.`;
      showToast("Upload complete");
      fileInput.value = "";
    } catch (e) {
      showToast((e as Error).message);
    }
    btnUpload.disabled = false;
  };

  const btnNext = el("button", "btn secondary");
  btnNext.textContent = "Continue";
  btnNext.onclick = () => onNext();

  container.append(h2, p, zone, btnUpload, status, adminLink, btnNext);
}
