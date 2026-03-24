// 国家物流枢纽布局图 - 主脚本
const DATA = window.LOGISTICS_HUBS_DATA || { hubs: [], statistics: {} };
const HUBS = DATA.hubs || [];

// 颜色配置 - 枢纽类型
const TYPE_COLORS = {
  '陆港型': '#1b9e77',
  '港口型': '#d95f02',
  '空港型': '#7570b3',
  '生产服务型': '#e7298a',
  '商贸服务型': '#66a61e',
  '陆上边境口岸型': '#a6761d'
};

// 标记尺寸
const MARKER_SIZES = {
  default: 7,
  highlighted: 10
};

// 应用状态
const state = {
  selectedTypes: new Set(Object.keys(TYPE_COLORS)),
  selectedBatches: new Set(),
  selectedProvinces: new Set(),
  activeTab: 'map',
  markers: [],
  infoWindow: null,
  sidebarCollapsed: false,
  searchResults: []
};

// DOM 元素
let map = null;
let toolbarEl, tabsEl, panelMapEl, panelStatsEl;
let hubTypesEl, hubBatchesEl, hubProvincesEl, legendEl, statusEl;
let typesAllBtn, typesNoneBtn, batchesAllBtn, batchesNoneBtn, provincesAllBtn, provincesNoneBtn;
let searchInputEl, searchClearEl, searchResultsEl, sidebarToggleEl;

// 初始化地图
function initMap() {
  try {
    map = new AMap.Map('map', {
      zoom: 4,
      center: [105.0, 35.0],
      viewMode: '2D'
    });

    state.infoWindow = new AMap.InfoWindow({
      offset: new AMap.Pixel(0, -10),
      width: 280
    });

    // 标记地图已加载
    const mapEl = document.getElementById('map');
    if (mapEl) {
      mapEl.classList.add('amap-loaded');
    }

    console.log('地图初始化成功');
  } catch (e) {
    console.error('地图初始化失败:', e);
  }
}

// 初始化筛选器 UI
function initFilters() {
  // 获取唯一值
  const batches = [...new Set(HUBS.map(h => h.batch).filter(Boolean))];
  const provinces = [...new Set(HUBS.map(h => h.province))].sort((a, b) => a.localeCompare(b, 'zh'));

  // 初始化选中的批次
  batches.forEach(b => state.selectedBatches.add(b));
  provinces.forEach(p => state.selectedProvinces.add(p));

  // 渲染枢纽类型筛选
  renderTypeFilters();

  // 渲染批次筛选
  renderBatchFilters(batches);

  // 渲染省份筛选
  renderProvinceFilters(provinces);

  // 渲染图例
  renderLegend();

  // 绑定按钮事件
  bindFilterButtons();
}

function renderTypeFilters() {
  if (!hubTypesEl) return;
  hubTypesEl.innerHTML = '';

  // 计算每种类型的数量
  const typeCounts = {};
  HUBS.forEach(hub => {
    typeCounts[hub.type] = (typeCounts[hub.type] || 0) + 1;
  });

  Object.keys(TYPE_COLORS).forEach(type => {
    const count = typeCounts[type] || 0;
    const label = document.createElement('label');
    label.className = 'chip active';
    label.dataset.type = type;
    label.innerHTML = `<input type="checkbox" checked data-type="${type}" />${type}<span class="chip-count">${count}</span>`;
    hubTypesEl.appendChild(label);
  });

  // 绑定事件
  hubTypesEl.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', (e) => {
      const type = e.target.dataset.type;
      if (e.target.checked) {
        state.selectedTypes.add(type);
        e.target.parentElement.classList.add('active');
      } else {
        state.selectedTypes.delete(type);
        e.target.parentElement.classList.remove('active');
      }
      applyFilters();
    });
  });
}

function renderBatchFilters(batches) {
  if (!hubBatchesEl) return;
  hubBatchesEl.innerHTML = '';

  // 计算每个批次的数量
  const batchCounts = {};
  HUBS.forEach(hub => {
    if (hub.batch) {
      batchCounts[hub.batch] = (batchCounts[hub.batch] || 0) + 1;
    }
  });

  batches.forEach(batch => {
    const count = batchCounts[batch] || 0;
    const label = document.createElement('label');
    label.className = 'chip active';
    label.dataset.batch = batch;
    label.innerHTML = `<input type="checkbox" checked data-batch="${batch}" />${batch.replace(' (', '(')}<span class="chip-count">${count}</span>`;
    hubBatchesEl.appendChild(label);
  });

  hubBatchesEl.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', (e) => {
      const batch = e.target.dataset.batch;
      if (e.target.checked) {
        state.selectedBatches.add(batch);
        e.target.parentElement.classList.add('active');
      } else {
        state.selectedBatches.delete(batch);
        e.target.parentElement.classList.remove('active');
      }
      applyFilters();
    });
  });
}

function renderProvinceFilters(provinces) {
  if (!hubProvincesEl) return;
  hubProvincesEl.innerHTML = '';

  // 计算每个省份的数量
  const provinceCounts = {};
  HUBS.forEach(hub => {
    provinceCounts[hub.province] = (provinceCounts[hub.province] || 0) + 1;
  });

  provinces.forEach(province => {
    const count = provinceCounts[province] || 0;
    const label = document.createElement('label');
    label.className = 'chip active';
    label.dataset.province = province;
    label.innerHTML = `<input type="checkbox" checked data-province="${province}" />${province}<span class="chip-count">${count}</span>`;
    hubProvincesEl.appendChild(label);
  });

  hubProvincesEl.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', (e) => {
      const province = e.target.dataset.province;
      if (e.target.checked) {
        state.selectedProvinces.add(province);
        e.target.parentElement.classList.add('active');
      } else {
        state.selectedProvinces.delete(province);
        e.target.parentElement.classList.remove('active');
      }
      applyFilters();
    });
  });
}

function renderLegend() {
  if (!legendEl) return;
  legendEl.innerHTML = '';

  Object.entries(TYPE_COLORS).forEach(([type, color]) => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <span class="swatch type-${type}" style="background: ${color}"></span>
      <span>${type}</span>
    `;
    legendEl.appendChild(item);
  });
}

function bindFilterButtons() {
  // 类型全选/清空
  if (typesAllBtn) {
    typesAllBtn.addEventListener('click', () => {
      state.selectedTypes = new Set(Object.keys(TYPE_COLORS));
      hubTypesEl.querySelectorAll('input[type="checkbox"]').forEach(i => {
        i.checked = true;
        i.parentElement.classList.add('active');
      });
      applyFilters();
    });
  }

  if (typesNoneBtn) {
    typesNoneBtn.addEventListener('click', () => {
      state.selectedTypes.clear();
      hubTypesEl.querySelectorAll('input[type="checkbox"]').forEach(i => {
        i.checked = false;
        i.parentElement.classList.remove('active');
      });
      applyFilters();
    });
  }

  // 批次全选/清空
  if (batchesAllBtn) {
    batchesAllBtn.addEventListener('click', () => {
      const batches = [...new Set(HUBS.map(h => h.batch).filter(Boolean))];
      state.selectedBatches = new Set(batches);
      hubBatchesEl.querySelectorAll('input[type="checkbox"]').forEach(i => {
        i.checked = true;
        i.parentElement.classList.add('active');
      });
      applyFilters();
    });
  }

  if (batchesNoneBtn) {
    batchesNoneBtn.addEventListener('click', () => {
      state.selectedBatches.clear();
      hubBatchesEl.querySelectorAll('input[type="checkbox"]').forEach(i => {
        i.checked = false;
        i.parentElement.classList.remove('active');
      });
      applyFilters();
    });
  }

  // 省份全选/清空
  if (provincesAllBtn) {
    provincesAllBtn.addEventListener('click', () => {
      const provinces = [...new Set(HUBS.map(h => h.province))];
      state.selectedProvinces = new Set(provinces);
      hubProvincesEl.querySelectorAll('input[type="checkbox"]').forEach(i => {
        i.checked = true;
        i.parentElement.classList.add('active');
      });
      applyFilters();
    });
  }

  if (provincesNoneBtn) {
    provincesNoneBtn.addEventListener('click', () => {
      state.selectedProvinces.clear();
      hubProvincesEl.querySelectorAll('input[type="checkbox"]').forEach(i => {
        i.checked = false;
        i.parentElement.classList.remove('active');
      });
      applyFilters();
    });
  }
}

// 应用筛选
function applyFilters() {
  let visibleCount = 0;

  state.markers.forEach(marker => {
    const hub = marker.hub;
    const typeMatch = state.selectedTypes.has(hub.type);
    const batchMatch = !hub.batch || state.selectedBatches.has(hub.batch);
    const provinceMatch = state.selectedProvinces.has(hub.province);
    const visible = typeMatch && batchMatch && provinceMatch;

    if (visible) {
      marker.show();
      if (marker.label) marker.label.show();
      visibleCount++;
    } else {
      marker.hide();
      if (marker.label) marker.label.hide();
    }
  });

  // 更新状态文本
  if (statusEl) {
    statusEl.textContent = `显示 ${visibleCount}/${HUBS.length} 个枢纽`;
  }

  // 更新统计图表
  if (state.activeTab === 'stats') {
    renderStats();
  }
}

// 创建标记
function createMarkers() {
  const fragment = [];

  // 用于检测重复坐标的 Map
  const coordCount = new Map();

  HUBS.forEach(hub => {
    if (!hub.location) return;

    const color = TYPE_COLORS[hub.type] || '#999';

    // 检测是否有重复坐标，如果有则添加微小偏移
    const coordKey = `${hub.location.lng.toFixed(4)},${hub.location.lat.toFixed(4)}`;
    const count = coordCount.get(coordKey) || 0;
    coordCount.set(coordKey, count + 1);

    // 计算偏移量（每个重复点偏移 0.008 度，约 800 米）
    const offsetX = (count % 3) * 0.008;
    const offsetY = Math.floor(count / 3) * 0.008;
    const lng = hub.location.lng + offsetX;
    const lat = hub.location.lat + offsetY;

    // 创建标记点容器
    const markerEl = document.createElement('div');
    markerEl.className = 'hub-marker';
    markerEl.style.width = `${MARKER_SIZES.default * 2.2}px`;
    markerEl.style.height = `${MARKER_SIZES.default * 2.2}px`;

    // 基底颜色层
    const baseEl = document.createElement('div');
    baseEl.className = 'hub-marker-base';
    baseEl.style.background = color;
    markerEl.appendChild(baseEl);

    // 渐变层 - 微妙 3D 感
    const gradientEl = document.createElement('div');
    gradientEl.className = 'hub-marker-gradient';
    markerEl.appendChild(gradientEl);

    // 内发光 - 非常 subtle
    const glowEl = document.createElement('div');
    glowEl.className = 'hub-marker-glow';
    glowEl.style.background = `radial-gradient(circle, ${lightenColor(color, 40)} 0%, transparent 70%)`;
    markerEl.appendChild(glowEl);

    const marker = new AMap.Marker({
      position: [lng, lat],
      content: markerEl,
      offset: new AMap.Pixel(-MARKER_SIZES.default * 1.1, -MARKER_SIZES.default * 1.1),
      zIndex: 100
    });

    marker.hub = hub;
    marker.markerEl = markerEl;
    marker.setMap(map);

    // 创建悬停提示（独立元素，添加到 map 容器）
    const tooltipEl = document.createElement('div');
    tooltipEl.className = 'hub-tooltip';
    tooltipEl.innerHTML = `
      <div class="hub-tooltip-name">${hub.name}</div>
      <div class="hub-tooltip-type">${hub.type}</div>
    `;
    tooltipEl.style.display = 'none';
    document.getElementById('map').appendChild(tooltipEl);

    // 悬停显示提示
    markerEl.addEventListener('mouseenter', (e) => {
      e.stopPropagation();
      const rect = markerEl.getBoundingClientRect();
      const mapRect = document.getElementById('map').getBoundingClientRect();
      tooltipEl.style.display = 'block';
      tooltipEl.style.left = (rect.left - mapRect.left + rect.width / 2) + 'px';
      tooltipEl.style.top = (rect.top - mapRect.top) + 'px';
      setTimeout(() => tooltipEl.classList.add('show'), 10);
    });

    markerEl.addEventListener('mouseleave', (e) => {
      e.stopPropagation();
      tooltipEl.classList.remove('show');
      setTimeout(() => {
        if (!tooltipEl.classList.contains('show')) {
          tooltipEl.style.display = 'none';
        }
      }, 150);
    });

    // 点击显示详情
    marker.on('click', () => showHubInfo(marker));

    fragment.push(marker);
  });

  state.markers = fragment;
}

// 颜色变亮/变暗工具函数
function lightenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return `rgb(${R}, ${G}, ${B})`;
}

function darkenColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return `rgb(${R}, ${G}, ${B})`;
}

// 显示枢纽信息
function showHubInfo(marker) {
  const hub = marker.hub;
  const typeColor = TYPE_COLORS[hub.type] || '#999';

  const content = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 16px 20px;">
        <div style="font-weight: 700; font-size: 16px; color: #fff; margin-bottom: 4px;">${hub.name}</div>
        <div style="font-size: 12px; color: rgba(255,255,255,0.8);">${hub.city} · ${hub.province}</div>
      </div>
      <div style="padding: 16px 20px; background: #fff;">
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">
          <span style="background: ${typeColor}; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${hub.type}</span>
          <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">${hub.batch || '未定批次'}</span>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding-top: 12px; border-top: 1px solid #f0f0f0;">
          <div>
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 2px;">省份</div>
            <div style="font-size: 13px; font-weight: 600; color: #333;">${hub.province}</div>
          </div>
          <div>
            <div style="font-size: 10px; color: #999; text-transform: uppercase; margin-bottom: 2px;">城市</div>
            <div style="font-size: 13px; font-weight: 600; color: #333;">${hub.city}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  state.infoWindow.setContent(content);
  state.infoWindow.open(map, marker.getPosition());
}

// 切换 Tab
function bindTabs() {
  if (!tabsEl) return;

  tabsEl.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      if (tab === state.activeTab) return;

      state.activeTab = tab;
      tabsEl.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (panelMapEl) panelMapEl.hidden = tab !== 'map';
      if (panelStatsEl) panelStatsEl.hidden = tab !== 'stats';

      if (tab === 'stats') {
        renderStats();
      }
    });
  });
}

// 初始化侧边栏和搜索功能
function initSidebarAndSearch() {
  // 侧边栏折叠/展开
  if (sidebarToggleEl) {
    sidebarToggleEl.addEventListener('click', toggleSidebar);
  }

  // 搜索功能
  if (searchInputEl) {
    searchInputEl.addEventListener('input', handleSearchInput);
    searchInputEl.addEventListener('focus', handleSearchFocus);
  }

  if (searchClearEl) {
    searchClearEl.addEventListener('click', clearSearch);
  }

  // 点击搜索结果外部关闭
  document.addEventListener('click', (e) => {
    if (searchResultsEl && !searchResultsEl.contains(e.target) && e.target !== searchInputEl) {
      searchResultsEl.classList.remove('show');
    }
  });
}

// 切换侧边栏
function toggleSidebar() {
  const app = document.getElementById('app');
  state.sidebarCollapsed = !state.sidebarCollapsed;

  if (state.sidebarCollapsed) {
    app.classList.add('sidebar-collapsed');
  } else {
    app.classList.remove('sidebar-collapsed');
  }

  // 地图需要重新调整大小
  if (map && state.sidebarCollapsed) {
    setTimeout(() => {
      map.resize();
    }, 300);
  }
}

// 处理搜索输入
function handleSearchInput(e) {
  const query = e.target.value.trim();
  const searchBox = e.target.closest('.search-box');

  if (query.length > 0) {
    searchBox.classList.add('has-value');
    performSearch(query);
  } else {
    searchBox.classList.remove('has-value');
    hideSearchResults();
  }
}

// 处理搜索框聚焦
function handleSearchFocus(e) {
  const query = e.target.value.trim();
  if (query.length > 0) {
    performSearch(query);
  }
}

// 执行搜索
function performSearch(query) {
  const lowerQuery = query.toLowerCase();

  const results = HUBS.filter(hub => {
    return hub.name.toLowerCase().includes(lowerQuery) ||
           hub.city.toLowerCase().includes(lowerQuery) ||
           hub.province.toLowerCase().includes(lowerQuery);
  }).slice(0, 10); // 最多显示 10 条结果

  state.searchResults = results;
  renderSearchResults(results, query);
}

// 渲染搜索结果
function renderSearchResults(results, query) {
  if (!searchResultsEl) return;

  if (results.length === 0) {
    searchResultsEl.innerHTML = `
      <div class="no-results">
        <div>未找到匹配的枢纽</div>
        <div style="font-size: 11px; margin-top: 4px; color: var(--gray-400);">尝试其他关键词搜索</div>
      </div>
    `;
  } else {
    searchResultsEl.innerHTML = results.map(hub => {
      const typeColor = TYPE_COLORS[hub.type] || '#999';
      return `
        <div class="search-result-item" data-hub='${JSON.stringify(hub).replace(/'/g, "&#39;")}'>
          <div class="search-result-name">${highlightMatch(hub.name, query)}</div>
          <div class="search-result-info">
            <span class="search-result-tag" style="background: ${typeColor}; color: #fff;">${hub.type}</span>
            <span>${hub.province} · ${hub.city}</span>
          </div>
        </div>
      `;
    }).join('');

    // 绑定点击事件
    searchResultsEl.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const hubJson = item.dataset.hub;
        try {
          const hub = JSON.parse(hubJson);
          selectHub(hub);
        } catch (e) {
          console.error('解析枢纽数据失败:', e);
        }
      });
    });
  }

  searchResultsEl.classList.add('show');
}

// 高亮匹配文本
function highlightMatch(text, query) {
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark style="background: #fef3c7; color: #92400e; padding: 0 2px; border-radius: 2px;">$1</mark>');
}

// 隐藏搜索结果
function hideSearchResults() {
  if (searchResultsEl) {
    searchResultsEl.classList.remove('show');
  }
}

// 清空搜索
function clearSearch() {
  if (searchInputEl) {
    searchInputEl.value = '';
    searchInputEl.focus();
  }
  const searchBox = document.querySelector('.search-box');
  if (searchBox) {
    searchBox.classList.remove('has-value');
  }
  hideSearchResults();
}

// 选择枢纽并定位到地图
function selectHub(hub) {
  if (!map || !hub.location) return;

  // 关闭搜索结果
  hideSearchResults();
  clearSearch();

  // 地图飞向目标位置
  map.panTo([hub.location.lng, hub.location.lat]);
  map.setZoom(10, true);

  // 找到对应的标记并显示信息窗口
  const marker = state.markers.find(m => m.hub.name === hub.name);
  if (marker) {
    showHubInfo(marker);
  }

  // 侧边栏在移动端自动折叠
  if (window.innerWidth < 768) {
    toggleSidebar();
  }
}

// 渲染统计数据
function renderStats() {
  // 计算当前筛选下的统计
  const visibleHubs = state.markers
    .filter(m => {
      const hub = m.hub;
      return state.selectedTypes.has(hub.type) &&
        (!hub.batch || state.selectedBatches.has(hub.batch)) &&
        state.selectedProvinces.has(hub.province);
    })
    .map(m => m.hub);

  // 更新卡片
  const statTotal = document.getElementById('stat-total');
  const statCities = document.getElementById('stat-cities');
  const statProvinces = document.getElementById('stat-provinces');

  if (statTotal) statTotal.textContent = visibleHubs.length;
  if (statCities) {
    const uniqueCities = new Set(visibleHubs.map(h => h.city)).size;
    statCities.textContent = uniqueCities;
  }
  if (statProvinces) {
    const uniqueProvinces = new Set(visibleHubs.map(h => h.province)).size;
    statProvinces.textContent = uniqueProvinces;
  }

  // 渲染图表
  renderTypeChart(visibleHubs);
  renderBatchChart(visibleHubs);
  renderProvinceChart(visibleHubs);
}

function renderTypeChart(hubs) {
  const container = document.getElementById('chart-type');
  if (!container) return;

  const counts = {};
  hubs.forEach(h => {
    counts[h.type] = (counts[h.type] || 0) + 1;
  });

  const maxCount = Math.max(...Object.values(counts), 1);
  const total = hubs.length;

  container.innerHTML = '';
  let delay = 0;
  Object.entries(TYPE_COLORS).forEach(([type, color]) => {
    const count = counts[type] || 0;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    const barWidth = total > 0 ? Math.round((count / maxCount) * 100) : 0;

    const item = document.createElement('div');
    item.className = 'bar-item';
    item.style.opacity = '0';
    item.style.animation = `fadeIn 0.3s ease forwards ${delay * 0.1}s`;
    item.innerHTML = `
      <div class="bar-label">${type}</div>
      <div class="bar-container">
        <div class="bar-fill" style="width: 0%; background: ${color}" data-width="${barWidth}%"></div>
      </div>
      <div class="bar-value">${count} (${percent}%)</div>
    `;
    container.appendChild(item);

    // 动画效果
    setTimeout(() => {
      const barFill = item.querySelector('.bar-fill');
      if (barFill) {
        barFill.style.width = barWidth + '%';
      }
    }, delay * 100 + 100);

    delay++;
  });
}

function renderBatchChart(hubs) {
  const container = document.getElementById('chart-batch');
  if (!container) return;

  const counts = {};
  hubs.forEach(h => {
    const batch = h.batch || '未定批次';
    counts[batch] = (counts[batch] || 0) + 1;
  });

  const batches = Object.keys(counts).sort();
  const maxCount = Math.max(...Object.values(counts), 1);
  const total = hubs.length;

  const batchColors = {
    '第一批 (2019 年)': 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
    '第二批 (2020 年)': 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
    '第三批 (2022 年)': 'linear-gradient(90deg, #fa709a 0%, #fee140 100%)',
    '第四批 (2023 年)': 'linear-gradient(90deg, #a18cd1 0%, #fbc2eb 100%)',
    '未定批次': 'linear-gradient(90deg, #d7d1cc 0%, #a8a8a8 100%)'
  };

  container.innerHTML = '';
  let delay = 0;
  batches.forEach(batch => {
    const count = counts[batch] || 0;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    const barWidth = total > 0 ? Math.round((count / maxCount) * 100) : 0;
    const color = batchColors[batch] || '#999';
    const displayBatch = batch.replace(' (', '(').replace('年)', ')');

    const item = document.createElement('div');
    item.className = 'bar-item';
    item.style.opacity = '0';
    item.style.animation = `fadeIn 0.3s ease forwards ${delay * 0.1}s`;
    item.innerHTML = `
      <div class="bar-label">${displayBatch}</div>
      <div class="bar-container">
        <div class="bar-fill" style="width: 0%; background: ${color}" data-width="${barWidth}%"></div>
      </div>
      <div class="bar-value">${count} (${percent}%)</div>
    `;
    container.appendChild(item);

    // 动画效果
    setTimeout(() => {
      const barFill = item.querySelector('.bar-fill');
      if (barFill) {
        barFill.style.width = barWidth + '%';
      }
    }, delay * 100 + 100);

    delay++;
  });
}

function renderProvinceChart(hubs) {
  const container = document.getElementById('chart-province');
  if (!container) return;

  const counts = {};
  hubs.forEach(h => {
    counts[h.province] = (counts[h.province] || 0) + 1;
  });

  // 排序并取 TOP10
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const maxCount = Math.max(...sorted.map(s => s[1]), 1);
  const total = hubs.length;

  container.innerHTML = '';
  let delay = 0;
  sorted.forEach(([province, count]) => {
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    const barWidth = total > 0 ? Math.round((count / maxCount) * 100) : 0;

    const item = document.createElement('div');
    item.className = 'bar-item';
    item.style.opacity = '0';
    item.style.animation = `fadeIn 0.3s ease forwards ${delay * 0.1}s`;
    item.innerHTML = `
      <div class="bar-label">${province.substring(0, 6)}</div>
      <div class="bar-container">
        <div class="bar-fill" style="width: 0%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%)" data-width="${barWidth}%"></div>
      </div>
      <div class="bar-value">${count}</div>
    `;
    container.appendChild(item);

    // 动画效果
    setTimeout(() => {
      const barFill = item.querySelector('.bar-fill');
      if (barFill) {
        barFill.style.width = barWidth + '%';
      }
    }, delay * 100 + 100);

    delay++;
  });
}

// 初始化
function init() {
  console.log('=== 应用初始化开始 ===');
  console.log('AMap 状态:', {
    hasAMap: !!window.AMap,
    hasMap: !!(window.AMap && AMap.Map),
    version: window.AMap ? 'loaded' : 'not loaded'
  });
  console.log('数据状态:', {
    hasData: !!window.LOGISTICS_HUBS_DATA,
    hubCount: HUBS.length
  });

  // 获取 DOM 元素
  toolbarEl = document.getElementById('toolbar');
  tabsEl = document.getElementById('tabs');
  panelMapEl = document.getElementById('panel-map');
  panelStatsEl = document.getElementById('panel-stats');
  hubTypesEl = document.getElementById('hub-types');
  hubBatchesEl = document.getElementById('hub-batches');
  hubProvincesEl = document.getElementById('hub-provinces');
  legendEl = document.getElementById('legend');
  statusEl = document.getElementById('status');
  typesAllBtn = document.getElementById('types-all');
  typesNoneBtn = document.getElementById('types-none');
  batchesAllBtn = document.getElementById('batches-all');
  batchesNoneBtn = document.getElementById('batches-none');
  provincesAllBtn = document.getElementById('provinces-all');
  provincesNoneBtn = document.getElementById('provinces-none');
  // 搜索和侧边栏元素
  searchInputEl = document.getElementById('search-input');
  searchClearEl = document.getElementById('search-clear');
  searchResultsEl = document.getElementById('search-results');
  sidebarToggleEl = document.getElementById('sidebar-toggle');

  console.log('DOM 元素获取:', {
    hubTypesEl: !!hubTypesEl,
    hubBatchesEl: !!hubBatchesEl,
    hubProvincesEl: !!hubProvincesEl,
    legendEl: !!legendEl,
    searchInputEl: !!searchInputEl,
    sidebarToggleEl: !!sidebarToggleEl
  });

  // 初始化筛选器 UI
  initFilters();

  // 初始化侧边栏和搜索功能
  initSidebarAndSearch();

  // 初始化地图
  if (window.AMap && AMap.Map) {
    initMap();
    createMarkers();
    console.log('高德地图加载成功');
  } else {
    console.warn('高德地图未加载，使用备用模式');
    if (statusEl) {
      statusEl.textContent = '地图加载中...';
    }
    // 等待地图加载
    window.addEventListener('load', () => {
      if (window.AMap && AMap.Map) {
        initMap();
        createMarkers();
        console.log('高德地图延迟加载成功');
      } else {
        console.error('地图加载失败 - AMap:', !!window.AMap, 'Map:', !!(window.AMap && AMap.Map));
        if (statusEl) {
          statusEl.textContent = '地图加载失败，请检查网络或 API Key';
        }
      }
    });
  }

  // 绑定 Tab
  bindTabs();

  // 更新状态
  if (statusEl) {
    statusEl.textContent = `已加载 ${HUBS.length} 个枢纽`;
  }

  console.log('初始化完成，枢纽数量:', HUBS.length);
}

// 启动
init();
