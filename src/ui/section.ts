// Collapsible panel section helper. Pure DOM, no state coupling.

export interface Section {
  root: HTMLElement;
  body: HTMLElement;
}

export function makeSection(title: string, open = false): Section {
  const root = document.createElement("section");
  root.className = "section" + (open ? " open" : "");

  const header = document.createElement("button");
  header.type = "button";
  header.className = "section-header";
  header.innerHTML = `<span class="chevron">▸</span><span>${title}</span>`;

  const body = document.createElement("div");
  body.className = "section-body";

  header.addEventListener("click", () => root.classList.toggle("open"));
  root.append(header, body);
  return { root, body };
}
