// /srv/3dgs/site/js/viewer.js

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SplatMesh } from "@sparkjsdev/spark";

// ===============================
// 1. モデル＆生薬情報のデータ定義
// ===============================

let models = [];

// ===============================
// 2. three.js + Spark ビューア初期化
// ===============================

const viewerWrapperEl = document.getElementById("viewerInfoWrapper");
const viewerEl = document.getElementById("viewer");
const infoPanelEl = document.getElementById("infoPanel");
const splitterEl = document.getElementById("splitter");

let width = viewerEl.clientWidth;
let height = viewerEl.clientHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 1000);
camera.position.set(0, 0, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(width, height);
viewerEl.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const ambient = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambient);

let currentSplat = null;

function loadModel(url) {
  if (currentSplat) {
    scene.remove(currentSplat);
    if (typeof currentSplat.dispose === "function") {
      currentSplat.dispose();
    }
    currentSplat = null;
  }

  const splat = new SplatMesh({ url });
  currentSplat = splat;
  scene.add(splat);
}

function onResize() {
  const rect = viewerEl.getBoundingClientRect();
  width = rect.width || window.innerWidth;
  height = rect.height || window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener("resize", onResize);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ===============================
// 3-A. 右パネルのドラッグリサイズ
// ===============================

let isDraggingSplitter = false;

if (splitterEl && viewerWrapperEl && viewerEl && infoPanelEl) {
  const minViewerWidth = 320; // px
  const minInfoWidth = 260;   // px

  splitterEl.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return; // 左クリックのみ
    e.preventDefault();
    isDraggingSplitter = true;
    document.body.classList.add("resizing");
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDraggingSplitter) return;

    const rect = viewerWrapperEl.getBoundingClientRect();
    const splitterRect = splitterEl.getBoundingClientRect();
    const splitterWidth = splitterRect.width || 6;

    let newViewerWidth = e.clientX - rect.left;
    const maxViewerWidth = rect.width - splitterWidth - minInfoWidth;

    if (newViewerWidth < minViewerWidth) newViewerWidth = minViewerWidth;
    if (newViewerWidth > maxViewerWidth) newViewerWidth = maxViewerWidth;

    const newInfoWidth = rect.width - splitterWidth - newViewerWidth;

    viewerEl.style.flex = `0 0 ${newViewerWidth}px`;
    infoPanelEl.style.flex = `0 0 ${newInfoWidth}px`;

    onResize();
  });

  document.addEventListener("mouseup", () => {
    if (!isDraggingSplitter) return;
    isDraggingSplitter = false;
    document.body.classList.remove("resizing");
  });
}

// ===============================
// 3-B. UI (一覧 & 情報パネル & クイズ)
// ===============================

// 左：モデル一覧＋検索UI
const modelListEl    = document.getElementById("modelList");
const searchInputEl  = document.getElementById("searchInput");
const tagFilterEl    = document.getElementById("tagFilter");

// 右：情報パネル
const infoTitleEl     = document.getElementById("info-title");
const infoLatinEl     = document.getElementById("info-latin");
const infoSourceEl    = document.getElementById("info-source");
const infoPartEl      = document.getElementById("info-part");
const infoExtraEl     = document.getElementById("info-extra");
const descEl          = document.getElementById("description");
const mediaGalleryEl  = document.getElementById("mediaGallery");

// クイズ
const quizContentEl  = document.getElementById("quiz-content");
const quizFeedbackEl = document.getElementById("quiz-feedback");

let activeModelId = null;

// タグフィルタの <select> 初期化
function initTagFilter() {
  if (!tagFilterEl) return;

  const tagSet = new Set();
  models.forEach((m) => {
    if (Array.isArray(m.tags)) {
      m.tags.forEach((t) => tagSet.add(t));
    }
  });

  tagFilterEl.innerHTML = "";
  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = "すべてのタグ";
  tagFilterEl.appendChild(optAll);

  Array.from(tagSet)
    .sort()
    .forEach((tag) => {
      const opt = document.createElement("option");
      opt.value = tag;
      opt.textContent = tag;
      tagFilterEl.appendChild(opt);
    });
}

// モデル一覧の描画（検索＋タグ絞り込み対応版）
function renderModelList() {
  if (!modelListEl) return;

  const keyword =
    ((searchInputEl && searchInputEl.value) || "").trim().toLowerCase();
  const tagFilter = (tagFilterEl && tagFilterEl.value) || "";

  modelListEl.innerHTML = "";

  models.forEach((m) => {
    // 🔍 キーワードフィルタ（和名・学名・ID）
    const text = `${m.nameJa || ""} ${m.latinName || ""} ${m.id || ""}`.toLowerCase();
    if (keyword && !text.includes(keyword)) {
      return;
    }

    // 🏷 タグフィルタ
    if (tagFilter) {
      const tags = m.tags || [];
      if (!tags.includes(tagFilter)) {
        return;
      }
    }

    const card = document.createElement("div");
    card.className = "model-card";
    card.dataset.id = m.id;

    if (m.id === activeModelId) {
      card.classList.add("active");
    }

    const title = document.createElement("div");
    title.className = "model-title";
    title.textContent = m.nameJa;

    const sub = document.createElement("div");
    sub.className = "model-sub";
    sub.textContent = m.latinName;

    const tagsRow = document.createElement("div");
    tagsRow.className = "model-tags";
    (m.tags || []).forEach((t) => {
      const tagEl = document.createElement("span");
      tagEl.className = "tag";
      tagEl.textContent = t;
      tagsRow.appendChild(tagEl);
    });

    card.appendChild(title);
    card.appendChild(sub);
    if ((m.tags || []).length > 0) {
      card.appendChild(tagsRow);
    }

    card.addEventListener("click", () => {
      selectModelById(m.id, { fromUser: true });
    });

    modelListEl.appendChild(card);
  });
}

// 選択中カードの見た目更新
function updateActiveCard() {
  if (!modelListEl) return;
  const cards = modelListEl.querySelectorAll(".model-card");
  cards.forEach((card) => {
    card.classList.toggle("active", card.dataset.id === activeModelId);
  });
}

// 右パネルの情報更新
function updateInfoPanel(model) {
  infoTitleEl.textContent = model.nameJa;
  infoLatinEl.textContent = model.latinName || "";

  // --- 基原植物：属＋種だけ斜体、命名者は通常書体 ---
  const srcLatin  = model.sourcePlantLatin;
  const srcAuthor = model.sourcePlantAuthor;

  if (srcLatin || srcAuthor) {
    const latinPart  = srcLatin
      ? `<span class="latin-binomial">${srcLatin}</span>`
      : "";
    const authorPart = srcAuthor ? ` ${srcAuthor}` : "";
    infoSourceEl.innerHTML = latinPart + authorPart;
  } else if (model.sourcePlant) {
    // まだ分割していない古いデータ向けのフォールバック
    infoSourceEl.textContent = model.sourcePlant;
  } else {
    infoSourceEl.textContent = "-";
  }

  infoPartEl.textContent  = model.part  || "-";
  infoExtraEl.textContent = model.extra || "-";
  descEl.textContent      = model.description || "";

  // ★ ここから画像ギャラリーの更新
  mediaGalleryEl.innerHTML = "";
  if (Array.isArray(model.images)) {
    model.images.forEach((imgInfo) => {
      const item = document.createElement("div");
      item.className = "media-item";

      const img = document.createElement("img");
      img.src = imgInfo.src;
      img.alt = imgInfo.caption || model.nameJa;

      const cap = document.createElement("div");
      cap.className = "media-caption";
      cap.textContent = imgInfo.caption || "";

      item.appendChild(img);
      item.appendChild(cap);
      mediaGalleryEl.appendChild(item);
    });
  }
}  // ★ ← ここがさっき抜けていた閉じカッコ

function updateQuiz(model) {
  quizFeedbackEl.textContent = "";
  quizFeedbackEl.style.color = "#e5e7eb";

  if (!model.quiz) {
    quizContentEl.innerHTML =
      '<div class="quiz-question">このモデルにはクイズが設定されていません。</div>';
    return;
  }

  const q = model.quiz;
  quizContentEl.innerHTML = "";

  const qDiv = document.createElement("div");
  qDiv.className = "quiz-question";
  qDiv.textContent = q.question;
  quizContentEl.appendChild(qDiv);

  const optionsDiv = document.createElement("div");
  optionsDiv.className = "quiz-options";

  q.options.forEach((opt, idx) => {
    const btn = document.createElement("button");
    btn.className = "quiz-option-btn";
    btn.textContent = opt;

    btn.addEventListener("click", () => {
      const btns = quizContentEl.querySelectorAll(".quiz-option-btn");
      btns.forEach((b) => {
        b.classList.remove("correct", "incorrect");
        b.disabled = true;
      });

      if (idx === q.correctIndex) {
        btn.classList.add("correct");
        quizFeedbackEl.style.color = "#4ade80";
        quizFeedbackEl.textContent =
          "正解です！" + (q.explanation ? " " + q.explanation : "");
      } else {
        btn.classList.add("incorrect");
        quizFeedbackEl.style.color = "#f97373";
        quizFeedbackEl.textContent =
          "不正解です。" + (q.explanation ? " " + q.explanation : "");
      }
    });

    optionsDiv.appendChild(btn);
  });

  quizContentEl.appendChild(optionsDiv);
}

function selectModelById(id, { fromUser = false } = {}) {
  const model = models.find((m) => m.id === id);
  if (!model) return;

  activeModelId = id;
  updateActiveCard();
  loadModel(model.fileUrl);
  updateInfoPanel(model);
  updateQuiz(model);
  onResize();

  if (fromUser && window.history && window.URLSearchParams) {
    const url = new URL(window.location.href);
    url.searchParams.set("model", id);
    window.history.replaceState({}, "", url.toString());
  }
}

function selectInitialModel() {
  let idFromUrl = null;
  try {
    const url = new URL(window.location.href);
    idFromUrl = url.searchParams.get("model");
  } catch (e) {
    // ignore
  }

  if (idFromUrl && models.some((m) => m.id === idFromUrl)) {
    selectModelById(idFromUrl, { fromUser: false });
  } else if (models.length > 0) {
    selectModelById(models[0].id, { fromUser: false });
  }
}


// ===============================
// 4. 生薬データ読み込み＆初期化
// ===============================

async function loadModelsAndInit() {
  try {
    const res = await fetch("/data/herbs.json");
    if (!res.ok) {
      throw new Error("Failed to load herbs.json: " + res.status);
    }
    models = await res.json();

    // タグ一覧を初期化
    initTagFilter();

    // 一覧を表示してから初期モデル選択
    renderModelList();
    selectInitialModel();
    onResize();

    // 検索・タグ変更イベント
    if (searchInputEl) {
      searchInputEl.addEventListener("input", () => {
        renderModelList();
        updateActiveCard();
      });
    }

    if (tagFilterEl) {
      tagFilterEl.addEventListener("change", () => {
        renderModelList();
        updateActiveCard();
      });
    }
  } catch (err) {
    console.error(err);
    const listEl = document.getElementById("modelList");
    if (listEl) {
      listEl.innerHTML =
        '<div style="color:#f97373;font-size:12px;">生薬データの読み込みに失敗しました。</div>';
    }
  }
}

// エントリーポイント
loadModelsAndInit();

