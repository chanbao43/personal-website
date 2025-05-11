// DOM元素
const navbar = document.querySelector(".navbar");
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");
const carousel = document.querySelector(".carousel");
const carouselInner = document.querySelector(".carousel-inner");
const carouselIndicators = document.querySelector(".carousel-indicators");
const prevBtn = document.querySelector(".carousel-prev");
const nextBtn = document.querySelector(".carousel-next");
const chatHistory = document.querySelector(".chat-history");
const textarea = document.querySelector("textarea");
const sendBtn = document.querySelector(".send-btn");
const clearBtn = document.querySelector(".clear-btn");
const voiceBtn = document.querySelector(".voice-btn");

// 轮播图配置
const carouselImages = [
  {
    url: "https://picsum.photos/1920/1080?random=1",
    description: "这是第一张图片的描述",
  },
  {
    url: "https://picsum.photos/1920/1080?random=2",
    description: "这是第二张图片的描述",
  },
  {
    url: "https://picsum.photos/1920/1080?random=3",
    description: "这是第三张图片的描述",
  },
];

let currentSlide = 0;
let carouselInterval;

// DeepSeek API配置
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
let DEEPSEEK_API_KEY = ""; // API密钥将通过加密存储

// 对话历史记录管理
const CHAT_HISTORY_KEY = "chat_history";
const MAX_RETRY_ATTEMPTS = 3;

// 加密函数
function encryptKey(key) {
  return btoa(key.split("").reverse().join("")); // 简单的加密方式
}

// 解密函数
function decryptKey(encryptedKey) {
  return atob(encryptedKey).split("").reverse().join("");
}

// 预设API密钥（加密存储）
const ENCRYPTED_API_KEY = encryptKey("sk-06b76ee4c6b143f59350a0c8abd4c8c2");

// 修改配置API密钥的函数
function configureAPIKey() {
  if (!localStorage.getItem("deepseek_api_key")) {
    localStorage.setItem("deepseek_api_key", ENCRYPTED_API_KEY);
  }
  DEEPSEEK_API_KEY = decryptKey(localStorage.getItem("deepseek_api_key"));
  return true;
}

// 修改检查API密钥的函数
function checkAPIKey() {
  const savedKey = localStorage.getItem("deepseek_api_key");
  if (savedKey) {
    DEEPSEEK_API_KEY = decryptKey(savedKey);
    return true;
  }
  return configureAPIKey();
}

// 调用DeepSeek API
async function callDeepSeekAPI(message, retryCount = 0) {
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (retryCount < MAX_RETRY_ATTEMPTS && response.status >= 500) {
        // 服务器错误，尝试重试
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        );
        return callDeepSeekAPI(message, retryCount + 1);
      }
      throw new Error(`API调用失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    if (retryCount < MAX_RETRY_ATTEMPTS && error.message.includes("网络")) {
      // 网络错误，尝试重试
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * (retryCount + 1))
      );
      return callDeepSeekAPI(message, retryCount + 1);
    }
    throw error;
  }
}

// 修改消息处理函数
async function handleMessage(message) {
  // 检查API密钥
  if (!DEEPSEEK_API_KEY && !checkAPIKey()) {
    addMessage("请先配置DeepSeek API密钥", false);
    return;
  }

  // 显示用户消息
  addMessage(message, true);

  // 显示加载指示器
  const indicator = showTypingIndicator();

  try {
    // 调用API获取回复
    const response = await callDeepSeekAPI(message);

    // 移除加载指示器
    indicator.remove();

    // 显示AI回复
    addMessage(response, false);
  } catch (error) {
    // 移除加载指示器
    indicator.remove();

    // 显示错误消息
    addMessage("抱歉，无法获取回复。请稍后再试。", false);
  }
}

// 修改发送消息的逻辑
function sendMessage() {
  const message = textarea.value.trim();
  if (message) {
    handleMessage(message);
    textarea.value = "";
    textarea.style.height = "auto";
  }
}

// 修改重置API密钥的按钮函数
function addResetKeyButton() {
  const chatTools = document.querySelector(".chat-tools");
  const resetKeyBtn = document.createElement("button");
  resetKeyBtn.textContent = "恢复默认API密钥";
  resetKeyBtn.className = "reset-key-btn";
  resetKeyBtn.addEventListener("click", () => {
    if (confirm("确定要恢复默认API密钥吗？")) {
      localStorage.setItem("deepseek_api_key", ENCRYPTED_API_KEY);
      DEEPSEEK_API_KEY = decryptKey(ENCRYPTED_API_KEY);
      addMessage("API密钥已恢复为默认设置", false);
    }
  });
  chatTools.appendChild(resetKeyBtn);
}

// 初始化轮播图
function initCarousel() {
  // 添加图片
  carouselImages.forEach((image, index) => {
    const img = document.createElement("img");
    img.src = image.url;
    img.alt = image.description;
    if (index === 0) img.classList.add("active");
    carouselInner.appendChild(img);

    // 添加指示器
    const indicator = document.createElement("span");
    if (index === 0) indicator.classList.add("active");
    indicator.addEventListener("click", () => goToSlide(index));
    carouselIndicators.appendChild(indicator);
  });

  // 启动自动轮播
  startCarousel();
}

// 轮播控制函数
function startCarousel() {
  carouselInterval = setInterval(nextSlide, 5000);
}

function stopCarousel() {
  clearInterval(carouselInterval);
}

function nextSlide() {
  goToSlide((currentSlide + 1) % carouselImages.length);
}

function prevSlide() {
  goToSlide((currentSlide - 1 + carouselImages.length) % carouselImages.length);
}

function goToSlide(index) {
  const images = carouselInner.querySelectorAll("img");
  const indicators = carouselIndicators.querySelectorAll("span");

  images[currentSlide].classList.remove("active");
  indicators[currentSlide].classList.remove("active");

  currentSlide = index;

  images[currentSlide].classList.add("active");
  indicators[currentSlide].classList.add("active");
}

// 导航栏控制
function toggleMenu() {
  navLinks.classList.toggle("active");
  hamburger.classList.toggle("active");
}

// 消息处理
function addMessage(content, isUser = true, time = null, shouldSave = true) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isUser ? "user" : "ai"} animate-fade-in`;

  const messageContent = document.createElement("div");
  messageContent.className = "message-content";

  if (!isUser) {
    messageContent.innerHTML = marked.parse(content);
    messageContent.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  } else {
    messageContent.textContent = content;
  }

  const timeDiv = document.createElement("div");
  timeDiv.className = "message-time";
  timeDiv.textContent = time || new Date().toLocaleTimeString();

  messageDiv.appendChild(messageContent);
  messageDiv.appendChild(timeDiv);
  chatHistory.appendChild(messageDiv);

  chatHistory.scrollTop = chatHistory.scrollHeight;

  if (shouldSave) {
    saveChatHistory();
  }
}

// 显示AI正在输入状态
function showTypingIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("span");
    indicator.appendChild(dot);
  }
  chatHistory.appendChild(indicator);
  chatHistory.scrollTop = chatHistory.scrollHeight;
  return indicator;
}

// 作品集筛选功能
function initPortfolio() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  const portfolioItems = document.querySelectorAll(".portfolio-item");

  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // 更新按钮状态
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // 获取筛选类别
      const filterValue = btn.getAttribute("data-filter");

      // 筛选项目
      portfolioItems.forEach((item) => {
        const itemCategory = item.getAttribute("data-category");
        if (filterValue === "all" || filterValue === itemCategory) {
          item.style.display = "block";
          setTimeout(() => {
            item.classList.remove("hidden");
          }, 10);
        } else {
          item.classList.add("hidden");
          setTimeout(() => {
            item.style.display = "none";
          }, 300);
        }
      });
    });
  });

  // 添加作品预览功能
  const previewLinks = document.querySelectorAll(".preview-link");
  previewLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const portfolioItem = link.closest(".portfolio-item");
      const title = portfolioItem.querySelector("h3").textContent;
      const description = portfolioItem.querySelector("p").textContent;
      const image = portfolioItem.querySelector("img").src;

      // 这里可以添加预览模态框的显示逻辑
      alert(`预览项目：${title}\n${description}`);
    });
  });
}

// 对话历史记录管理
function saveChatHistory() {
  const messages = Array.from(chatHistory.children).map((msg) => ({
    content: msg.querySelector(".message-content").innerHTML,
    isUser: msg.classList.contains("user"),
    time: msg.querySelector(".message-time").textContent,
  }));
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
}

function loadChatHistory() {
  const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
  if (savedHistory) {
    const messages = JSON.parse(savedHistory);
    chatHistory.innerHTML = "";
    messages.forEach((msg) => {
      addMessage(msg.content, msg.isUser, msg.time, false);
    });
  }
}

// 初始化函数
function initChat() {
  loadChatHistory();
  addResetKeyButton();
  checkAPIKey();
}

// 主题切换
function initThemeToggle() {
  const themeToggle = document.createElement("button");
  themeToggle.className = "theme-toggle";
  themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  document.body.appendChild(themeToggle);

  // 加载保存的主题
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme === "dark");
  }

  themeToggle.addEventListener("click", () => {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    const newTheme = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeIcon(!isDark);
  });
}

function updateThemeIcon(isDark) {
  const themeToggle = document.querySelector(".theme-toggle i");
  themeToggle.className = isDark ? "fas fa-sun" : "fas fa-moon";
}

// 页面过渡动画
function initSectionAnimations() {
  const sections = document.querySelectorAll("section");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  sections.forEach((section) => {
    section.classList.add("section");
    observer.observe(section);
  });
}

// 平滑滚动
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        // 在移动端自动关闭导航菜单
        if (window.innerWidth <= 768) {
          navLinks.classList.remove("active");
          hamburger.classList.remove("active");
        }
      }
    });
  });
}

// 社交媒体链接处理
function initSocialLinks() {
  const biliLink = document.querySelector(".social-icon.bilibili");
  if (biliLink) {
    // 设置B站空间链接
    biliLink.setAttribute("href", "https://space.bilibili.com/382144191");
    biliLink.setAttribute("title", "我的B站空间 (Ctrl+点击打开)");

    // 添加点击事件处理
    biliLink.addEventListener("click", (e) => {
      // 如果不是按住Ctrl键点击，则阻止默认行为
      if (!e.ctrlKey) {
        e.preventDefault();
        // 可以在这里添加提示
        const tooltip = document.createElement("div");
        tooltip.className = "link-tooltip";
        tooltip.textContent = "请按住Ctrl键点击访问";
        tooltip.style.position = "absolute";
        tooltip.style.top = `${e.pageY - 30}px`;
        tooltip.style.left = `${e.pageX}px`;
        document.body.appendChild(tooltip);

        // 2秒后移除提示
        setTimeout(() => {
          tooltip.remove();
        }, 2000);
      }
    });
  }
}

// 事件监听器
document.addEventListener("DOMContentLoaded", () => {
  // 初始化轮播图
  initCarousel();

  // 导航栏滚动效果
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });

  // 汉堡菜单点击事件
  hamburger.addEventListener("click", toggleMenu);

  // 轮播图控制
  prevBtn.addEventListener("click", () => {
    stopCarousel();
    prevSlide();
    startCarousel();
  });

  nextBtn.addEventListener("click", () => {
    stopCarousel();
    nextSlide();
    startCarousel();
  });

  carousel.addEventListener("mouseenter", stopCarousel);
  carousel.addEventListener("mouseleave", startCarousel);

  // 检查API密钥
  checkAPIKey();

  // 添加重置API密钥按钮
  addResetKeyButton();

  // 发送消息
  sendBtn.addEventListener("click", sendMessage);

  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // 自动调整文本框高度
  textarea.addEventListener("input", () => {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  });

  // 清空对话
  clearBtn.addEventListener("click", () => {
    if (confirm("确定要清空所有对话吗？")) {
      chatHistory.innerHTML = "";
    }
  });

  // 语音输入（需要浏览器支持）
  if ("webkitSpeechRecognition" in window) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "zh-CN";

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      textarea.value = text;
    };

    voiceBtn.addEventListener("click", () => {
      recognition.start();
      voiceBtn.classList.add("recording");
    });

    recognition.onend = () => {
      voiceBtn.classList.remove("recording");
    };
  } else {
    voiceBtn.style.display = "none";
  }

  // 初始化作品集
  initPortfolio();

  // 初始化聊天历史记录
  initChat();

  // 初始化主题切换
  initThemeToggle();

  // 初始化页面过渡动画
  initSectionAnimations();

  // 初始化平滑滚动
  initSmoothScroll();

  // 初始化社交媒体链接
  initSocialLinks();
});
