// DOM元素
const portfolioForm = document.getElementById("portfolioForm");
const contentTypeBtns = document.querySelectorAll(".content-type-btn");
const markdownEditor = document.getElementById("markdownEditor");
const mediaUpload = document.getElementById("mediaUpload");
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const mediaPreview = document.getElementById("mediaPreview");
const tagInput = document.getElementById("tagInput");
const tagsContainer = document.getElementById("tagsContainer");
const previewModal = document.getElementById("previewModal");
const closeBtn = document.querySelector(".close-btn");
const previewContent = document.querySelector(".preview-content");

// 初始化Markdown编辑器
const easyMDE = new EasyMDE({
  element: document.getElementById("mdContent"),
  spellChecker: false,
  status: false,
  toolbar: [
    "bold",
    "italic",
    "heading",
    "|",
    "quote",
    "code",
    "link",
    "image",
    "|",
    "preview",
  ],
});

// 内容类型切换
contentTypeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    contentTypeBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const type = btn.dataset.type;
    if (type === "markdown") {
      markdownEditor.classList.add("active");
      mediaUpload.classList.remove("active");
    } else {
      markdownEditor.classList.remove("active");
      mediaUpload.classList.add("active");
    }
  });
});

// 文件拖放处理
dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.style.borderColor = "var(--accent-color)";
});

dropZone.addEventListener("dragleave", () => {
  dropZone.style.borderColor = "var(--border-color)";
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.style.borderColor = "var(--border-color)";
  handleFiles(e.dataTransfer.files);
});

dropZone.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", (e) => {
  handleFiles(e.target.files);
});

// 文件处理函数
function handleFiles(files) {
  Array.from(files).forEach((file) => {
    if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        addMediaPreview(e.target.result, file.type);
      };
      reader.readAsDataURL(file);
    }
  });
}

// 添加媒体预览
function addMediaPreview(src, type) {
  const mediaItem = document.createElement("div");
  mediaItem.className = "media-item";

  if (type.startsWith("image/")) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "预览图片";
    mediaItem.appendChild(img);
  } else if (type.startsWith("video/")) {
    const video = document.createElement("video");
    video.src = src;
    video.controls = true;
    mediaItem.appendChild(video);
  }

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-btn";
  removeBtn.innerHTML = '<i class="fas fa-times"></i>';
  removeBtn.addEventListener("click", () => mediaItem.remove());

  mediaItem.appendChild(removeBtn);
  mediaPreview.appendChild(mediaItem);
}

// 标签处理
let tags = new Set();

tagInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    const tag = tagInput.value.trim();
    if (tag && !tags.has(tag)) {
      addTag(tag);
      tags.add(tag);
      tagInput.value = "";
    }
  }
});

function addTag(tagText) {
  const tag = document.createElement("div");
  tag.className = "tag";
  tag.innerHTML = `
        ${tagText}
        <span class="remove-tag">×</span>
    `;

  tag.querySelector(".remove-tag").addEventListener("click", () => {
    tags.delete(tagText);
    tag.remove();
  });

  tagsContainer.appendChild(tag);
}

// 本地存储
const STORAGE_KEY = "portfolio_items";

function savePortfolioItem(item) {
  const items = getPortfolioItems();
  items.push(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function getPortfolioItems() {
  const items = localStorage.getItem(STORAGE_KEY);
  return items ? JSON.parse(items) : [];
}

// 表单提交处理
portfolioForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = {
    title: document.getElementById("title").value,
    category: document.getElementById("category").value,
    description: document.getElementById("description").value,
    content: {
      type: document.querySelector(".content-type-btn.active").dataset.type,
      data:
        document.querySelector(".content-type-btn.active").dataset.type ===
        "markdown"
          ? easyMDE.value()
          : Array.from(mediaPreview.children).map((item) => ({
              type: item.querySelector("img") ? "image" : "video",
              src: item.querySelector("img, video").src,
            })),
    },
    tags: Array.from(tags),
    date: new Date().toISOString(),
  };

  try {
    // 保存到本地存储
    savePortfolioItem(formData);

    // 更新作品列表显示
    updatePortfolioList();

    // 重置表单
    portfolioForm.reset();
    easyMDE.value("");
    mediaPreview.innerHTML = "";
    tagsContainer.innerHTML = "";
    tags.clear();

    alert("作品保存成功！");
  } catch (error) {
    console.error("保存失败:", error);
    alert("保存失败，请重试");
  }
});

// 更新作品列表显示
function updatePortfolioList() {
  const portfolioItems = document.getElementById("portfolioItems");
  const items = getPortfolioItems();

  portfolioItems.innerHTML = items
    .map(
      (item) => `
        <div class="portfolio-item">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <div class="item-tags">
                ${item.tags
                  .map((tag) => `<span class="tag">${tag}</span>`)
                  .join("")}
            </div>
            <div class="item-actions">
                <button onclick="previewItem(${items.indexOf(
                  item
                )})">预览</button>
                <button onclick="deleteItem(${items.indexOf(
                  item
                )})">删除</button>
            </div>
        </div>
    `
    )
    .join("");
}

// 预览作品
function previewItem(index) {
  const items = getPortfolioItems();
  const item = items[index];

  let contentHtml = "";
  if (item.content.type === "markdown") {
    contentHtml = marked.parse(item.content.data);
  } else {
    contentHtml = item.content.data
      .map((media) =>
        media.type === "image"
          ? `<img src="${media.src}" alt="作品图片">`
          : `<video src="${media.src}" controls></video>`
      )
      .join("");
  }

  previewContent.innerHTML = `
        <h2>${item.title}</h2>
        <p>${item.description}</p>
        <div class="preview-tags">
            ${item.tags
              .map((tag) => `<span class="tag">${tag}</span>`)
              .join("")}
        </div>
        <div class="preview-content-area">
            ${contentHtml}
        </div>
    `;

  previewModal.style.display = "block";
}

// 删除作品
function deleteItem(index) {
  if (confirm("确定要删除这个作品吗？")) {
    const items = getPortfolioItems();
    items.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    updatePortfolioList();
  }
}

// 关闭预览模态框
closeBtn.addEventListener("click", () => {
  previewModal.style.display = "none";
});

// 点击模态框外部关闭
window.addEventListener("click", (e) => {
  if (e.target === previewModal) {
    previewModal.style.display = "none";
  }
});

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  updatePortfolioList();
});
