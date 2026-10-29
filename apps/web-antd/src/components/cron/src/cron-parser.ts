import dayjs from 'dayjs';

/**
 * 校验单字段匹配规则
 */
function matchField(
  value: number,
  pattern: string,
  min = 0,
  max = 59,
): boolean {
  if (value < min || value > max) return false;
  if (pattern === '*' || pattern === '?') return true;

  // 列表逗号分隔：1,2,5
  if (pattern.includes(',')) {
    return pattern
      .split(',')
      .some((p) => matchField(value, p.trim(), min, max));
  }

  // 步长：0/5 或 */10
  if (pattern.includes('/')) {
    const parts = pattern.split('/');
    const startStr = parts[0] || '*';
    const stepStr = parts[1] || '1';
    const start =
      startStr === '*' || startStr === '?'
        ? min
        : Number.parseInt(startStr, 10);
    const step = Number.parseInt(stepStr, 10);
    if (Number.isNaN(step) || step <= 0) return false;
    return value >= start && (value - start) % step === 0;
  }

  // 范围：1-5
  if (pattern.includes('-')) {
    const parts = pattern.split('-');
    const fromStr = parts[0] || '0';
    const toStr = parts[1] || '0';
    const from = Number.parseInt(fromStr, 10);
    const to = Number.parseInt(toStr, 10);
    return value >= from && value <= to;
  }

  // 单值匹配
  const single = Number.parseInt(pattern, 10);
  return !Number.isNaN(single) && value === single;
}

/**
 * 将周文本转为 1(MON)-7(SUN)
 */
function normalizeWeekPattern(pattern: string): string {
  const weekMap: Record<string, string> = {
    SUN: '7',
    MON: '1',
    TUE: '2',
    WED: '3',
    THU: '4',
    FRI: '5',
    SAT: '6',
  };
  let result = pattern.toUpperCase();
  Object.keys(weekMap).forEach((name) => {
    result = result.replaceAll(new RegExp(name, 'g'), weekMap[name] || name);
  });
  return result;
}

/**
 * 计算标准 6 段 Cron 表达式的最近 5 次调度执行时间
 * 格式：秒(0-59) 分(0-59) 时(0-23) 日(1-31) 月(1-12) 周(1-7/?)
 */
export function getNextRuns(cronExpression: string, count = 5): string[] {
  if (!cronExpression || !cronExpression.trim()) return [];

  const parts = cronExpression.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 7) {
    return [];
  }

  // 补齐为 6 段 (s m h d M w)
  const normalizedParts = parts.length === 5 ? ['0', ...parts] : parts;
  const [sec = '0', min = '*', hour = '*', dom = '*', month = '*', dow = '?'] =
    normalizedParts;

  const normalizedDow = normalizeWeekPattern(dow);

  const results: string[] = [];
  let current = dayjs().add(1, 'second').startOf('second');
  const maxIterations = 50_000;
  let iterations = 0;

  while (results.length < count && iterations < maxIterations) {
    iterations++;
    const s = current.second();
    const m = current.minute();
    const h = current.hour();
    const d = current.date();
    const M = current.month() + 1;
    // dayjs: 0 (Sun) to 6 (Sat) -> convert to 1(Mon)-7(Sun)
    const rawDay = current.day();
    const w = rawDay === 0 ? 7 : rawDay;

    const matchSec = matchField(s, sec, 0, 59);
    const matchMin = matchField(m, min, 0, 59);
    const matchHour = matchField(h, hour, 0, 23);
    const matchDom = matchField(d, dom, 1, 31);
    const matchMonth = matchField(M, month, 1, 12);
    const matchDow = matchField(w, normalizedDow, 1, 7);

    if (
      matchSec &&
      matchMin &&
      matchHour &&
      matchDom &&
      matchMonth &&
      matchDow
    ) {
      results.push(current.format('YYYY-MM-DD HH:mm:ss'));
      // 跳过当前这 1 秒
      current = current.add(1, 'second');
    } else {
      // 快速跳步优化
      if (!matchMonth) {
        current = current.add(1, 'month').startOf('month');
      } else if (!matchDom || !matchDow) {
        current = current.add(1, 'day').startOf('day');
      } else if (!matchHour) {
        current = current.add(1, 'hour').startOf('hour');
      } else if (matchMin) {
        current = current.add(1, 'second');
      } else {
        current = current.add(1, 'minute').startOf('minute');
      }
    }
  }

  return results;
}
