/* ============================================================
 * 小咕噜的日常 —— 生长标准数据配置文件
 * ------------------------------------------------------------
 * 分析弹窗中所有"标准范围/参考曲线"均从这里读取。
 * 需要调整标准数值时只改这个文件，部署后立即生效，无需改动 index.html。
 *
 * 字段说明：
 *   month      月龄（满 N 月；按每月25日切换月龄）
 *   min/max    柱状图绿色虚线的下限/上限
 *   p3/p50/p75 WHO 生长参考曲线的百分位（3%/50%/75%）
 * ============================================================ */
window.STD_CONFIG = {

  // 每日奶量标准（ml，水+奶）
  MILK_STD: [
    { month: 0,  min: 5,   max: 750 }, { month: 1,  min: 500, max: 750 },
    { month: 2,  min: 500, max: 750 }, { month: 3,  min: 700, max: 900 },
    { month: 4,  min: 700, max: 900 }, { month: 5,  min: 800, max: 1000 },
    { month: 6,  min: 800, max: 1000 }, { month: 7,  min: 700, max: 800 },
    { month: 8,  min: 700, max: 800 },  { month: 9,  min: 700, max: 800 },
    { month: 10, min: 600, max: 700 },  { month: 11, min: 600, max: 700 },
    { month: 12, min: 600, max: 700 },  { month: 13, min: 500, max: 600 },
    { month: 14, min: 500, max: 600 },  { month: 15, min: 500, max: 600 },
    { month: 16, min: 500, max: 600 },  { month: 17, min: 500, max: 600 },
    { month: 18, min: 500, max: 600 },  { month: 19, min: 400, max: 500 },
    { month: 20, min: 400, max: 500 },  { month: 21, min: 400, max: 500 },
    { month: 22, min: 400, max: 500 },  { month: 23, min: 400, max: 500 },
    { month: 24, min: 350, max: 500 }
  ],

  // 每日喝奶次数标准（次）
  MILK_COUNT_STD: [
    { month: 0,  min: 8, max: 12 }, { month: 1,  min: 7, max: 8 },
    { month: 2,  min: 7, max: 8 },  { month: 3,  min: 7, max: 8 },
    { month: 4,  min: 5, max: 6 },  { month: 5,  min: 5, max: 6 },
    { month: 6,  min: 5, max: 6 },  { month: 7,  min: 4, max: 6 },
    { month: 8,  min: 4, max: 5 },  { month: 9,  min: 4, max: 5 },
    { month: 10, min: 4, max: 5 },  { month: 11, min: 4, max: 5 },
    { month: 12, min: 3, max: 4 },  { month: 13, min: 2, max: 3 },
    { month: 14, min: 2, max: 3 },  { month: 15, min: 2, max: 3 },
    { month: 16, min: 2, max: 3 },  { month: 17, min: 2, max: 3 },
    { month: 18, min: 2, max: 3 },  { month: 19, min: 2, max: 3 },
    { month: 20, min: 2, max: 3 },  { month: 21, min: 2, max: 3 },
    { month: 22, min: 2, max: 3 },  { month: 23, min: 2, max: 3 },
    { month: 24, min: 2, max: 3 }
  ],

  // 每日睡眠时长标准（小时）
  SLEEP_STD: [
    { month: 0,  min: 13, max: 18 }, { month: 1,  min: 13, max: 18 },
    { month: 2,  min: 13, max: 18 }, { month: 3,  min: 13, max: 18 },
    { month: 4,  min: 12, max: 16 }, { month: 5,  min: 12, max: 16 },
    { month: 6,  min: 12, max: 16 }, { month: 7,  min: 12, max: 16 },
    { month: 8,  min: 12, max: 16 }, { month: 9,  min: 12, max: 16 },
    { month: 10, min: 12, max: 16 }, { month: 11, min: 12, max: 16 },
    { month: 12, min: 11, max: 14 }, { month: 13, min: 11, max: 14 },
    { month: 14, min: 11, max: 14 }, { month: 15, min: 11, max: 14 },
    { month: 16, min: 11, max: 14 }, { month: 17, min: 11, max: 14 },
    { month: 18, min: 11, max: 14 }, { month: 19, min: 11, max: 14 },
    { month: 20, min: 11, max: 14 }, { month: 21, min: 11, max: 14 },
    { month: 22, min: 11, max: 14 }, { month: 23, min: 11, max: 14 },
    { month: 24, min: 11, max: 14 }
  ],

  // 每日大便次数标准（0-36 月龄；仅 max 有参考意义，min 均为 0）
  POOP_STD: [
    { month: 0,  min: 0, max: 7 }, { month: 1,  min: 0, max: 7 },
    { month: 2,  min: 0, max: 7 }, { month: 3,  min: 0, max: 7 },
    { month: 4,  min: 0, max: 7 }, { month: 5,  min: 0, max: 7 },
    { month: 6,  min: 0, max: 3 }, { month: 7,  min: 0, max: 3 },
    { month: 8,  min: 0, max: 3 }, { month: 9,  min: 0, max: 3 },
    { month: 10, min: 0, max: 3 }, { month: 11, min: 0, max: 3 },
    { month: 12, min: 0, max: 3 }, { month: 13, min: 0, max: 3 },
    { month: 14, min: 0, max: 3 }, { month: 15, min: 0, max: 3 },
    { month: 16, min: 0, max: 3 }, { month: 17, min: 0, max: 3 },
    { month: 18, min: 0, max: 3 }, { month: 19, min: 0, max: 3 },
    { month: 20, min: 0, max: 3 }, { month: 21, min: 0, max: 3 },
    { month: 22, min: 0, max: 3 }, { month: 23, min: 0, max: 3 },
    { month: 24, min: 0, max: 3 }, { month: 25, min: 0, max: 3 },
    { month: 26, min: 0, max: 3 }, { month: 27, min: 0, max: 3 },
    { month: 28, min: 0, max: 3 }, { month: 29, min: 0, max: 3 },
    { month: 30, min: 0, max: 3 }, { month: 31, min: 0, max: 3 },
    { month: 32, min: 0, max: 3 }, { month: 33, min: 0, max: 3 },
    { month: 34, min: 0, max: 3 }, { month: 35, min: 0, max: 3 },
    { month: 36, min: 0, max: 3 }
  ],

  // WHO 身高参考曲线（0-24 月龄，男孩，cm）
  WHO_HEIGHT: [
    { month: 0,  p3: 46.3, p50: 49.9, p75: 51.2 }, { month: 1,  p3: 51.1, p50: 54.7, p75: 56.0 },
    { month: 2,  p3: 54.7, p50: 58.4, p75: 59.8 }, { month: 3,  p3: 57.6, p50: 61.4, p75: 62.8 },
    { month: 4,  p3: 60.0, p50: 63.9, p75: 65.3 }, { month: 5,  p3: 61.9, p50: 65.9, p75: 67.3 },
    { month: 6,  p3: 63.6, p50: 67.6, p75: 69.1 }, { month: 7,  p3: 65.1, p50: 69.2, p75: 70.6 },
    { month: 8,  p3: 66.5, p50: 70.6, p75: 72.1 }, { month: 9,  p3: 67.7, p50: 72.0, p75: 73.5 },
    { month: 10, p3: 69.0, p50: 73.3, p75: 74.8 }, { month: 11, p3: 70.2, p50: 74.5, p75: 76.1 },
    { month: 12, p3: 71.3, p50: 75.7, p75: 77.4 }, { month: 13, p3: 72.4, p50: 76.9, p75: 78.6 },
    { month: 14, p3: 73.4, p50: 78.0, p75: 79.7 }, { month: 15, p3: 74.4, p50: 79.1, p75: 80.9 },
    { month: 16, p3: 75.4, p50: 80.2, p75: 82.0 }, { month: 17, p3: 76.3, p50: 81.2, p75: 83.0 },
    { month: 18, p3: 77.2, p50: 82.3, p75: 84.1 }, { month: 19, p3: 78.1, p50: 83.2, p75: 85.1 },
    { month: 20, p3: 78.9, p50: 84.2, p75: 86.1 }, { month: 21, p3: 79.7, p50: 85.1, p75: 87.1 },
    { month: 22, p3: 80.5, p50: 86.0, p75: 88.0 }, { month: 23, p3: 81.3, p50: 86.9, p75: 89.0 },
    { month: 24, p3: 82.1, p50: 87.8, p75: 89.9 }
  ],

  // WHO 体重参考曲线（0-24 月龄，男孩，kg）
  WHO_WEIGHT: [
    { month: 0,  p3: 2.5,  p50: 3.3,  p75: 3.7 },  { month: 1,  p3: 3.4,  p50: 4.5,  p75: 4.9 },
    { month: 2,  p3: 4.4,  p50: 5.6,  p75: 6.0 },  { month: 3,  p3: 5.1,  p50: 6.4,  p75: 6.9 },
    { month: 4,  p3: 5.6,  p50: 7.0,  p75: 7.6 },  { month: 5,  p3: 6.1,  p50: 7.5,  p75: 8.1 },
    { month: 6,  p3: 6.5,  p50: 7.9,  p75: 8.6 },  { month: 7,  p3: 6.8,  p50: 8.3,  p75: 9.0 },
    { month: 8,  p3: 7.1,  p50: 8.6,  p75: 9.4 },  { month: 9,  p3: 7.3,  p50: 8.9,  p75: 9.7 },
    { month: 10, p3: 7.6,  p50: 9.2,  p75: 10.0 }, { month: 11, p3: 7.8,  p50: 9.4,  p75: 10.3 },
    { month: 12, p3: 7.9,  p50: 9.6,  p75: 10.5 }, { month: 13, p3: 8.1,  p50: 9.9,  p75: 10.8 },
    { month: 14, p3: 8.3,  p50: 10.1, p75: 11.0 }, { month: 15, p3: 8.5,  p50: 10.3, p75: 11.3 },
    { month: 16, p3: 8.7,  p50: 10.5, p75: 11.5 }, { month: 17, p3: 8.9,  p50: 10.7, p75: 11.7 },
    { month: 18, p3: 9.1,  p50: 10.9, p75: 11.9 }, { month: 19, p3: 9.2,  p50: 11.1, p75: 12.2 },
    { month: 20, p3: 9.4,  p50: 11.3, p75: 12.4 }, { month: 21, p3: 9.6,  p50: 11.5, p75: 12.6 },
    { month: 22, p3: 9.7,  p50: 11.7, p75: 12.8 }, { month: 23, p3: 9.9,  p50: 11.9, p75: 13.1 },
    { month: 24, p3: 10.1, p50: 12.2, p75: 13.3 }
  ]
};
