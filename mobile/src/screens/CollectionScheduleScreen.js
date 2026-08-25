/**
 * BinGo – Collection Schedule Screen (Member 3)
 * Tabs: Today | Upcoming | Calendar | History
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/colors";
import { getSchedules } from "../services/scheduleService";

// ── Constants ─────────────────────────────────────────────────────────────
const WASTE_CONFIG = {
  "General Waste":   { emoji: "🗑️", color: "#6B7280", binLabel: "Grey Bin",  tip: "Bag your rubbish securely before placing outside." },
  "Recycling":       { emoji: "♻️", color: "#1D6FA4", binLabel: "Blue Bin",  tip: "Rinse containers. No food residue in the blue bin." },
  "Organic Waste":   { emoji: "🌿", color: "#2D5016", binLabel: "Green Bin", tip: "Food scraps, garden trimmings. No plastics." },
  "Garden Waste":    { emoji: "🌱", color: "#4A7C28", binLabel: "Green Bin", tip: "Bundle branches. Loose leaves in biodegradable bags." },
  "Hazardous Waste": { emoji: "⚠️", color: "#DC2626", binLabel: "Red Bin",   tip: "Batteries, chemicals. Keep separate from all other waste." },
};
const getWC = (t) => WASTE_CONFIG[t] || { emoji: "🗑️", color: COLORS.PRIMARY, binLabel: "Bin", tip: "" };

const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const AREAS  = ["Colombo 03", "Colombo 05", "Colombo 07"];

const HOLIDAYS = [
  { name: "Vesak Poya Day",   date: "12 May 2025",  change: true  },
  { name: "Poson Poya Day",   date: "13 Jun 2025",  change: true  },
  { name: "Independence Day", date: "04 Feb 2026",  change: false },
  { name: "Sinhala New Year", date: "14 Apr 2026",  change: true  },
];

// ── Helpers ───────────────────────────────────────────────────────────────
const getNextDate = (dayName) => {
  const today = new Date();
  const target = DAYS.indexOf(dayName);
  if (target === -1) return null;
  let diff = target - today.getDay();
  if (diff <= 0) diff += 7;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d;
};

const daysLeft = (date) => {
  if (!date) return 0;
  const t = new Date(); t.setHours(0,0,0,0);
  const d = new Date(date); d.setHours(0,0,0,0);
  return Math.round((d - t) / 86400000);
};

const fmtDate = (date) => {
  if (!date) return "";
  return `${DAYS[date.getDay()].slice(0,3)}, ${date.getDate()} ${MONTHS[date.getMonth()].slice(0,3)} ${date.getFullYear()}`;
};

const urgencyColor = (days) => days <= 1 ? COLORS.ERROR : days <= 3 ? COLORS.ACCENT : COLORS.PRIMARY;

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

// ── Shared components ─────────────────────────────────────────────────────
const Header = ({ navigation, title, area }) => (
  <View style={S.header}>
    <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}
      accessibilityRole="button" accessibilityLabel="Go back">
      <Text style={S.backIcon}>←</Text>
    </TouchableOpacity>
    <View style={S.headerMid}>
      <Text style={S.headerTitle}>{title}</Text>
      <Text style={S.headerSub}>📍 {area}</Text>
    </View>
    <View style={S.headerBadge}>
      <Text style={S.headerBadgeText}>LIVE</Text>
    </View>
  </View>
);

const AreaPicker = ({ selected, onSelect }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false}
    style={S.areaBar} contentContainerStyle={S.areaBarContent}>
    {AREAS.map((a) => (
      <TouchableOpacity key={a} style={[S.areaChip, selected === a && S.areaChipOn]}
        onPress={() => onSelect(a)} accessibilityRole="button">
        <Text style={[S.areaChipTxt, selected === a && S.areaChipTxtOn]}>📍 {a}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const TabBar = ({ active, onSelect }) => (
  <View style={S.tabBar}>
    {["Today","Upcoming","Calendar","History"].map((t) => (
      <TouchableOpacity key={t} style={[S.tab, active === t && S.tabOn]}
        onPress={() => onSelect(t)} accessibilityRole="tab">
        <Text style={[S.tabTxt, active === t && S.tabTxtOn]}>{t}</Text>
        {active === t && <View style={S.tabIndicator} />}
      </TouchableOpacity>
    ))}
  </View>
);

// ── TODAY TAB ─────────────────────────────────────────────────────────────
const TodayTab = ({ schedules, onViewUpcoming }) => {
  const todayName = DAYS[new Date().getDay()];
  const now = new Date();
  const todayItems = schedules.filter((s) => s.collectionDay === todayName);

  // next 3 upcoming (excluding today)
  const upcoming3 = schedules
    .map((s) => ({ ...s, nd: getNextDate(s.collectionDay) }))
    .filter((s) => daysLeft(s.nd) > 0)
    .sort((a, b) => daysLeft(a.nd) - daysLeft(b.nd))
    .slice(0, 3);

  // week strip — next 7 days
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() + i);
    const dn = DAYS[d.getDay()];
    const cols = schedules.filter((s) => s.collectionDay === dn);
    return { d, dn, cols, isToday: i === 0 };
  });

  return (
    <ScrollView style={S.content} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 28 }}>

      {/* Greeting banner */}
      <View style={S.greetBanner}>
        <View>
          <Text style={S.greetText}>{getGreeting()} 👋</Text>
          <Text style={S.greetSub}>{todayName}, {now.getDate()} {MONTHS[now.getMonth()]} {now.getFullYear()}</Text>
        </View>
        <View style={S.greetIcon}>
          <Text style={{ fontSize: 32 }}>🏡</Text>
        </View>
      </View>

      {/* Week strip */}
      <View style={S.weekStrip}>
        {weekDays.map(({ d, dn, cols, isToday }) => (
          <View key={d.toISOString()} style={[S.weekCell, isToday && S.weekCellToday]}>
            <Text style={[S.weekDayLabel, isToday && S.weekDayLabelOn]}>{dn.slice(0,3)}</Text>
            <Text style={[S.weekDateNum, isToday && S.weekDateNumOn]}>{d.getDate()}</Text>
            <View style={S.weekDots}>
              {cols.slice(0, 2).map((c, i) => (
                <View key={i} style={[S.weekDot, { backgroundColor: getWC(c.wasteType).color }]} />
              ))}
              {cols.length === 0 && <View style={[S.weekDot, { backgroundColor: "transparent" }]} />}
            </View>
          </View>
        ))}
      </View>

      {/* Today's collections */}
      <Text style={S.sectionLabel}>Today's Collections</Text>
      {todayItems.length === 0 ? (
        <View style={S.emptyCard}>
          <Text style={{ fontSize: 44, marginBottom: 8 }}>🎉</Text>
          <Text style={S.emptyTitle}>No Collection Today</Text>
          <Text style={S.emptySub}>Your next collection is coming soon. Check the Upcoming tab.</Text>
          <TouchableOpacity style={S.emptyBtn} onPress={onViewUpcoming}>
            <Text style={S.emptyBtnTxt}>View Upcoming →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        todayItems.map((item) => {
          const cfg = getWC(item.wasteType);
          return (
            <View key={item._id} style={[S.todayCard, { borderLeftColor: cfg.color }]}>
              {/* Colored top strip */}
              <View style={[S.todayStrip, { backgroundColor: cfg.color }]}>
                <Text style={S.todayStripEmoji}>{cfg.emoji}</Text>
                <View style={S.todayStripInfo}>
                  <Text style={S.todayStripType}>{item.wasteType}</Text>
                  <Text style={S.todayStripBin}>{cfg.binLabel}</Text>
                </View>
                <View style={S.todayBadge}><Text style={S.todayBadgeTxt}>TODAY</Text></View>
              </View>
              {/* Info rows */}
              <View style={S.todayBody}>
                <View style={S.infoRow}>
                  <View style={[S.infoIconBox, { backgroundColor: cfg.color + "18" }]}>
                    <Text style={S.infoIcon}>⏰</Text>
                  </View>
                  <View style={S.infoContent}>
                    <Text style={S.infoLabel}>Collection Time</Text>
                    <Text style={S.infoValue}>{item.collectionTime || "06:00 AM"} — Place bin outside before this time</Text>
                  </View>
                </View>
                <View style={S.infoRow}>
                  <View style={[S.infoIconBox, { backgroundColor: cfg.color + "18" }]}>
                    <Text style={S.infoIcon}>🔄</Text>
                  </View>
                  <View style={S.infoContent}>
                    <Text style={S.infoLabel}>Frequency</Text>
                    <Text style={S.infoValue}>{item.frequency?.charAt(0).toUpperCase() + item.frequency?.slice(1) || "Weekly"} — Every {item.collectionDay}</Text>
                  </View>
                </View>
                {item.notes && (
                  <View style={S.infoRow}>
                    <View style={[S.infoIconBox, { backgroundColor: cfg.color + "18" }]}>
                      <Text style={S.infoIcon}>📋</Text>
                    </View>
                    <View style={S.infoContent}>
                      <Text style={S.infoLabel}>Instructions</Text>
                      <Text style={S.infoValue}>{item.notes}</Text>
                    </View>
                  </View>
                )}
                {/* Tip */}
                <View style={[S.tipBox, { backgroundColor: cfg.color + "10", borderColor: cfg.color + "40" }]}>
                  <Text style={S.tipIcon}>💡</Text>
                  <Text style={[S.tipText, { color: cfg.color }]}>{cfg.tip}</Text>
                </View>
              </View>
            </View>
          );
        })
      )}

      {/* Coming up next — compact list */}
      {upcoming3.length > 0 && (
        <>
          <Text style={S.sectionLabel}>Coming Up Next</Text>
          <View style={S.comingCard}>
            {upcoming3.map((item, i) => {
              const cfg = getWC(item.wasteType);
              const dl = daysLeft(item.nd);
              return (
                <View key={i} style={[S.comingRow, i > 0 && S.comingRowBorder]}>
                  <View style={[S.comingDot, { backgroundColor: cfg.color }]} />
                  <Text style={S.comingEmoji}>{cfg.emoji}</Text>
                  <View style={S.comingInfo}>
                    <Text style={S.comingType}>{item.wasteType}</Text>
                    <Text style={S.comingDate}>{fmtDate(item.nd)}</Text>
                  </View>
                  <View style={[S.comingPill, { backgroundColor: urgencyColor(dl) }]}>
                    <Text style={S.comingPillTxt}>{dl}d</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}

      {/* Quick tips card */}
      <View style={S.tipsCard}>
        <Text style={S.tipsTitle}>♻️ Collection Tips</Text>
        {[
          "Place bins on the kerb by 6 AM on collection day",
          "Bring bins in by end of collection day",
          "Contaminated recycling goes to general waste",
          "Reduce, Reuse, then Recycle",
        ].map((tip, i) => (
          <View key={i} style={S.tipRow}>
            <Text style={S.tipBullet}>•</Text>
            <Text style={S.tipRowTxt}>{tip}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// ── UPCOMING TAB ──────────────────────────────────────────────────────────
const UpcomingTab = ({ schedules, onViewCalendar }) => {
  const upcoming = schedules
    .map((s) => ({ ...s, nd: getNextDate(s.collectionDay) }))
    .filter((s) => s.nd)
    .sort((a, b) => daysLeft(a.nd) - daysLeft(b.nd))
    .slice(0, 8);

  return (
    <ScrollView style={S.content} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 28 }}>

      {/* Summary stats */}
      <View style={S.statsRow}>
        <View style={[S.statCard, { borderTopColor: COLORS.PRIMARY }]}>
          <Text style={S.statNum}>{upcoming.length}</Text>
          <Text style={S.statLabel}>Scheduled</Text>
        </View>
        <View style={[S.statCard, { borderTopColor: COLORS.ERROR }]}>
          <Text style={[S.statNum, { color: COLORS.ERROR }]}>
            {upcoming.filter(s => daysLeft(s.nd) <= 2).length}
          </Text>
          <Text style={S.statLabel}>This Week</Text>
        </View>
        <View style={[S.statCard, { borderTopColor: COLORS.INFO }]}>
          <Text style={[S.statNum, { color: COLORS.INFO }]}>
            {[...new Set(upcoming.map(s => s.wasteType))].length}
          </Text>
          <Text style={S.statLabel}>Types</Text>
        </View>
      </View>

      <Text style={S.sectionLabel}>Next 8 Collections</Text>
      {upcoming.map((item, idx) => {
        const cfg = getWC(item.wasteType);
        const dl = daysLeft(item.nd);
        const uc = urgencyColor(dl);
        return (
          <View key={`${item._id}-${idx}`} style={S.upCard}>
            <View style={[S.upLeft, { backgroundColor: cfg.color + "15" }]}>
              <Text style={{ fontSize: 26 }}>{cfg.emoji}</Text>
            </View>
            <View style={S.upMid}>
              <Text style={S.upType}>{item.wasteType}</Text>
              <Text style={S.upDate}>{fmtDate(item.nd)}</Text>
              <View style={S.upMeta}>
                <Text style={S.upMetaTxt}>🕐 {item.collectionTime || "06:00 AM"}</Text>
                <Text style={S.upMetaDot}>·</Text>
                <Text style={S.upMetaTxt}>{cfg.binLabel}</Text>
              </View>
            </View>
            <View style={[S.upPill, { backgroundColor: uc }]}>
              <Text style={S.upPillNum}>{dl}</Text>
              <Text style={S.upPillLbl}>days</Text>
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={S.calBtn} onPress={onViewCalendar}>
        <Text style={S.calBtnTxt}>📅  View Full Calendar</Text>
      </TouchableOpacity>

      {/* Holiday schedule */}
      <HolidayCard />
    </ScrollView>
  );
};

// ── CALENDAR TAB ──────────────────────────────────────────────────────────
const CalendarTab = ({ schedules }) => {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selDay, setSelDay]       = useState(today.getDate());

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y=>y-1); } else setViewMonth(m=>m-1); setSelDay(null); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y=>y+1); } else setViewMonth(m=>m+1); setSelDay(null); };

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const colsForDay = (n) => {
    const dn = DAYS[new Date(viewYear, viewMonth, n).getDay()];
    return schedules.filter((s) => s.collectionDay === dn);
  };

  const selCols = selDay ? colsForDay(selDay) : [];

  const summary = {};
  for (let d = 1; d <= daysInMonth; d++) colsForDay(d).forEach((s) => { summary[s.wasteType] = (summary[s.wasteType] || 0) + 1; });

  return (
    <ScrollView style={S.content} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 28 }}>

      {/* Month nav */}
      <View style={S.calNav}>
        <TouchableOpacity onPress={prevMonth} style={S.calNavBtn}>
          <Text style={S.calNavArrow}>‹</Text>
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={S.calMonthTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
          <Text style={S.calMonthSub}>{Object.values(summary).reduce((a,b)=>a+b,0)} collections this month</Text>
        </View>
        <TouchableOpacity onPress={nextMonth} style={S.calNavBtn}>
          <Text style={S.calNavArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <View style={S.calCard}>
        <View style={S.calWeekRow}>
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
            <Text key={d} style={S.calWD}>{d}</Text>
          ))}
        </View>
        <View style={S.calGrid}>
          {Array.from({ length: firstDay }).map((_,i) => <View key={`e${i}`} style={S.calCell} />)}
          {Array.from({ length: daysInMonth }).map((_,i) => {
            const n = i + 1;
            const cols = colsForDay(n);
            const isToday   = n === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
            const isSel     = n === selDay;
            const isWeekend = [0,6].includes(new Date(viewYear, viewMonth, n).getDay());
            return (
              <TouchableOpacity key={n} style={[S.calCell, isToday && S.calCellToday, isSel && S.calCellSel]}
                onPress={() => setSelDay(n)} activeOpacity={0.75}>
                <Text style={[S.calDN, isToday && S.calDNToday, isSel && S.calDNSel, isWeekend && !isToday && !isSel && S.calDNWknd]}>{n}</Text>
                <View style={S.calDots}>
                  {cols.slice(0,3).map((c,ci) => (
                    <View key={ci} style={[S.calDot, { backgroundColor: getWC(c.wasteType).color }]} />
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Selected day panel */}
      {selDay && (
        <View style={S.selPanel}>
          <View style={S.selPanelHeader}>
            <Text style={S.selPanelDate}>
              {DAYS[new Date(viewYear, viewMonth, selDay).getDay()]}, {selDay} {MONTHS[viewMonth]}
            </Text>
            {selCols.length > 0 && (
              <View style={S.selPanelBadge}>
                <Text style={S.selPanelBadgeTxt}>{selCols.length} collection{selCols.length > 1 ? "s" : ""}</Text>
              </View>
            )}
          </View>
          {selCols.length === 0 ? (
            <View style={S.selEmpty}>
              <Text style={{ fontSize: 28 }}>😊</Text>
              <Text style={S.selEmptyTxt}>No collection on this day</Text>
            </View>
          ) : selCols.map((c, i) => {
            const cfg = getWC(c.wasteType);
            return (
              <View key={i} style={[S.selItem, { borderLeftColor: cfg.color }]}>
                <Text style={{ fontSize: 22, marginRight: 10 }}>{cfg.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={S.selItemType}>{c.wasteType}</Text>
                  <Text style={S.selItemSub}>{cfg.binLabel} · {c.collectionTime || "06:00 AM"}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Legend */}
      <View style={S.legend}>
        <Text style={S.legendTitle}>Legend</Text>
        <View style={S.legendGrid}>
          {Object.entries(WASTE_CONFIG).map(([type, cfg]) => (
            <View key={type} style={S.legendItem}>
              <View style={[S.legendDot, { backgroundColor: cfg.color }]} />
              <Text style={S.legendLbl}>{type}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Monthly summary */}
      <Text style={S.sectionLabel}>Summary — {MONTHS[viewMonth]}</Text>
      <View style={S.sumRow}>
        {Object.entries(summary).map(([type, count]) => {
          const cfg = getWC(type);
          return (
            <View key={type} style={[S.sumChip, { borderColor: cfg.color }]}>
              <Text style={{ fontSize: 20 }}>{cfg.emoji}</Text>
              <Text style={[S.sumCount, { color: cfg.color }]}>{count}x</Text>
              <Text style={S.sumType}>{type.split(" ")[0]}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

// ── HISTORY TAB ───────────────────────────────────────────────────────────
const HistoryTab = ({ schedules }) => {
  const [filter, setFilter] = useState("All");
  const types = ["All", ...Object.keys(WASTE_CONFIG)];

  const history = [];
  for (let i = 1; i <= 30; i++) {
    const date = new Date(); date.setDate(date.getDate() - i);
    const dn = DAYS[date.getDay()];
    schedules.filter((s) => s.collectionDay === dn).forEach((item) => {
      history.push({ ...item, date: new Date(date) });
    });
  }
  history.sort((a, b) => b.date - a.date);
  const filtered = filter === "All" ? history : history.filter(h => h.wasteType === filter);

  // stats
  const totalThisMonth = history.filter(h => h.date.getMonth() === new Date().getMonth()).length;
  const streak = (() => {
    let s = 0, d = new Date();
    for (let i = 0; i < 30; i++) {
      d.setDate(d.getDate() - 1);
      const dn = DAYS[d.getDay()];
      if (schedules.some(sc => sc.collectionDay === dn)) s++; else break;
    }
    return s;
  })();

  return (
    <ScrollView style={S.content} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 28 }}>

      {/* Stats */}
      <View style={S.statsRow}>
        <View style={[S.statCard, { borderTopColor: COLORS.SUCCESS }]}>
          <Text style={S.statNum}>{totalThisMonth}</Text>
          <Text style={S.statLabel}>This Month</Text>
        </View>
        <View style={[S.statCard, { borderTopColor: COLORS.ACCENT }]}>
          <Text style={[S.statNum, { color: COLORS.ACCENT }]}>{streak}</Text>
          <Text style={S.statLabel}>Day Streak 🔥</Text>
        </View>
        <View style={[S.statCard, { borderTopColor: COLORS.INFO }]}>
          <Text style={[S.statNum, { color: COLORS.INFO }]}>{history.length}</Text>
          <Text style={S.statLabel}>Past 30 Days</Text>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 0 }}>
        {types.slice(0, 4).map((t) => (
          <TouchableOpacity key={t} style={[S.filterChip, filter === t && S.filterChipOn]}
            onPress={() => setFilter(t)}>
            <Text style={[S.filterChipTxt, filter === t && S.filterChipTxtOn]}>
              {t === "All" ? "All Types" : getWC(t).emoji + " " + t.split(" ")[0]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={S.emptyCard}>
          <Text style={{ fontSize: 36 }}>📋</Text>
          <Text style={S.emptyTitle}>No history yet</Text>
        </View>
      ) : filtered.map((item, idx) => {
        const cfg = getWC(item.wasteType);
        const isRecent = idx < 3;
        return (
          <View key={`h${idx}`} style={[S.histCard, { borderLeftColor: cfg.color }]}>
            <View style={[S.histIcon, { backgroundColor: cfg.color + "15" }]}>
              <Text style={{ fontSize: 20 }}>{cfg.emoji}</Text>
            </View>
            <View style={S.histInfo}>
              <Text style={S.histType}>{item.wasteType}</Text>
              <Text style={S.histDate}>{fmtDate(item.date)}</Text>
              <Text style={S.histArea}>{item.area}</Text>
            </View>
            <View style={S.histRight}>
              <View style={S.histCheck}><Text style={S.histCheckTxt}>✓</Text></View>
              {isRecent && <Text style={S.histRecentLbl}>Recent</Text>}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

// ── Holiday Card ──────────────────────────────────────────────────────────
const HolidayCard = () => (
  <View style={S.holidayCard}>
    <View style={S.holidayTop}>
      <View style={S.holidayIconWrap}><Text style={{ fontSize: 18 }}>🗓️</Text></View>
      <View>
        <Text style={S.holidayTitle}>Holiday Schedule</Text>
        <Text style={S.holidaySub}>Collection may change on public holidays</Text>
      </View>
    </View>
    {HOLIDAYS.map((h) => (
      <View key={h.name} style={S.holidayRow}>
        <View style={[S.holidayDot, { backgroundColor: h.change ? COLORS.ACCENT : COLORS.SUCCESS }]} />
        <View style={{ flex: 1 }}>
          <Text style={S.holidayName}>{h.name}</Text>
          <Text style={S.holidayDate}>{h.date}</Text>
        </View>
        <View style={[S.holidayBadge, { backgroundColor: h.change ? "#FEF3C7" : "#DCFCE7" }]}>
          <Text style={[S.holidayBadgeTxt, { color: h.change ? "#92400E" : "#166534" }]}>
            {h.change ? "⚠ Changed" : "✓ Normal"}
          </Text>
        </View>
      </View>
    ))}
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────
const CollectionScheduleScreen = ({ navigation }) => {
  const [tab, setTab]         = useState("Today");
  const [schedules, setSch]   = useState([]);
  const [loading, setLoad]    = useState(true);
  const [area, setArea]       = useState("Colombo 03");
  const [showMissed, setMissed] = useState(true);

  const load = useCallback(async (a) => {
    setLoad(true);
    try { setSch(await getSchedules(a)); }
    catch { Alert.alert("Error", "Could not load schedules."); }
    finally { setLoad(false); }
  }, []);

  useEffect(() => { load(area); }, [area]);

  const renderTab = () => {
    if (loading) return (
      <View style={S.loader}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={S.loaderTxt}>Loading schedule...</Text>
      </View>
    );
    switch (tab) {
      case "Today":    return <TodayTab    schedules={schedules} onViewUpcoming={() => setTab("Upcoming")} />;
      case "Upcoming": return <UpcomingTab schedules={schedules} onViewCalendar={() => setTab("Calendar")} />;
      case "Calendar": return <CalendarTab schedules={schedules} />;
      case "History":  return <HistoryTab  schedules={schedules} />;
      default: return null;
    }
  };

  const todayName = DAYS[new Date().getDay()];
  const missedVisible = showMissed && tab === "Today" && !loading &&
    schedules.some(s => s.collectionDay === todayName);

  return (
    <SafeAreaView style={S.root}>
      <Header navigation={navigation} title="Collection Schedule" area={area} />
      <AreaPicker selected={area} onSelect={setArea} />
      {missedVisible && (
        <View style={S.missedBar}>
          <Text style={S.missedBarIcon}>⚠️</Text>
          <View style={{ flex: 1 }}>
            <Text style={S.missedBarTitle}>Collection day today!</Text>
            <Text style={S.missedBarSub}>Place your bin outside before collection time.</Text>
          </View>
          <TouchableOpacity onPress={() => setMissed(false)}>
            <Text style={S.missedBarClose}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
      <TabBar active={tab} onSelect={setTab} />
      <View style={{ flex: 1 }}>{renderTab()}</View>
    </SafeAreaView>
  );
};

export default CollectionScheduleScreen;

const S = StyleSheet.create({
  root:             { flex: 1, backgroundColor: COLORS.BACKGROUND },
  // Header
  header:           { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.HEADER_BG, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn:          { padding: 6, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8 },
  backIcon:         { fontSize: 18, color: COLORS.TEXT_INVERSE, fontWeight: "700" },
  headerMid:        { flex: 1 },
  headerTitle:      { fontSize: 17, fontWeight: "700", color: COLORS.TEXT_INVERSE },
  headerSub:        { fontSize: 11, color: COLORS.PRIMARY_TINT, marginTop: 1 },
  headerBadge:      { backgroundColor: "#16A34A", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  headerBadgeText:  { fontSize: 9, fontWeight: "800", color: "#fff", letterSpacing: 1 },
  // Area bar
  areaBar:          { maxHeight: 46, backgroundColor: COLORS.SURFACE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  areaBarContent:   { paddingHorizontal: 12, paddingVertical: 7, gap: 8, flexDirection: "row", alignItems: "center" },
  areaChip:         { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: COLORS.BORDER },
  areaChipOn:       { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
  areaChipTxt:      { fontSize: 12, color: COLORS.TEXT_SECONDARY, fontWeight: "500" },
  areaChipTxtOn:    { color: "#fff", fontWeight: "700" },
  // Missed bar
  missedBar:        { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFBEB", borderBottomWidth: 1, borderBottomColor: "#FDE68A", paddingHorizontal: 14, paddingVertical: 9, gap: 10 },
  missedBarIcon:    { fontSize: 18 },
  missedBarTitle:   { fontSize: 12, fontWeight: "700", color: "#92400E" },
  missedBarSub:     { fontSize: 11, color: "#78350F", marginTop: 1 },
  missedBarClose:   { fontSize: 14, color: COLORS.TEXT_SECONDARY, padding: 4 },
  // Tab bar
  tabBar:           { flexDirection: "row", backgroundColor: COLORS.SURFACE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  tab:              { flex: 1, paddingVertical: 11, alignItems: "center", position: "relative" },
  tabOn:            {},
  tabTxt:           { fontSize: 12, color: COLORS.TEXT_SECONDARY, fontWeight: "600" },
  tabTxtOn:         { color: COLORS.PRIMARY, fontWeight: "800" },
  tabIndicator:     { position: "absolute", bottom: 0, left: "20%", right: "20%", height: 3, backgroundColor: COLORS.PRIMARY, borderRadius: 2 },
  // Common
  content:          { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  sectionLabel:     { fontSize: 11, fontWeight: "800", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  loader:           { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loaderTxt:        { color: COLORS.TEXT_SECONDARY, fontSize: 14 },
  emptyCard:        { alignItems: "center", padding: 36, backgroundColor: COLORS.SURFACE, borderRadius: 16, marginBottom: 16, elevation: 1, borderWidth: 1, borderColor: COLORS.BORDER },
  emptyTitle:       { fontSize: 17, fontWeight: "700", color: COLORS.TEXT_PRIMARY, marginTop: 8 },
  emptySub:         { fontSize: 13, color: COLORS.TEXT_SECONDARY, textAlign: "center", marginTop: 6, lineHeight: 18 },
  emptyBtn:         { marginTop: 14, backgroundColor: COLORS.PRIMARY, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20 },
  emptyBtnTxt:      { color: "#fff", fontWeight: "700", fontSize: 13 },
  // Greeting banner
  greetBanner:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.PRIMARY, borderRadius: 16, padding: 16, marginBottom: 14 },
  greetText:        { fontSize: 18, fontWeight: "800", color: "#fff" },
  greetSub:         { fontSize: 12, color: COLORS.PRIMARY_TINT, marginTop: 4 },
  greetIcon:        { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 8 },
  // Week strip
  weekStrip:        { flexDirection: "row", backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 10, marginBottom: 16, borderWidth: 1, borderColor: COLORS.BORDER, elevation: 1 },
  weekCell:         { flex: 1, alignItems: "center", paddingVertical: 6, borderRadius: 10 },
  weekCellToday:    { backgroundColor: COLORS.PRIMARY },
  weekDayLabel:     { fontSize: 10, color: COLORS.TEXT_SECONDARY, fontWeight: "600" },
  weekDayLabelOn:   { color: COLORS.PRIMARY_TINT },
  weekDateNum:      { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY, marginTop: 2 },
  weekDateNumOn:    { color: "#fff" },
  weekDots:         { flexDirection: "row", gap: 2, marginTop: 3, height: 6 },
  weekDot:          { width: 5, height: 5, borderRadius: 3 },
  // Today card
  todayCard:        { backgroundColor: COLORS.SURFACE, borderRadius: 16, marginBottom: 14, borderLeftWidth: 4, elevation: 3, overflow: "hidden" },
  todayStrip:       { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  todayStripEmoji:  { fontSize: 30 },
  todayStripInfo:   { flex: 1 },
  todayStripType:   { fontSize: 16, fontWeight: "800", color: "#fff" },
  todayStripBin:    { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  todayBadge:       { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  todayBadgeTxt:    { color: "#fff", fontWeight: "800", fontSize: 10, letterSpacing: 1 },
  todayBody:        { padding: 14, gap: 10 },
  infoRow:          { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  infoIconBox:      { width: 34, height: 34, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  infoIcon:         { fontSize: 16 },
  infoContent:      { flex: 1 },
  infoLabel:        { fontSize: 10, fontWeight: "700", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  infoValue:        { fontSize: 13, color: COLORS.TEXT_PRIMARY, lineHeight: 18 },
  tipBox:           { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  tipIcon:          { fontSize: 14 },
  tipText:          { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "500" },
  // Coming up
  comingCard:       { backgroundColor: COLORS.SURFACE, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.BORDER, overflow: "hidden", elevation: 1 },
  comingRow:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, gap: 10 },
  comingRowBorder:  { borderTopWidth: 1, borderTopColor: COLORS.DIVIDER },
  comingDot:        { width: 8, height: 8, borderRadius: 4 },
  comingEmoji:      { fontSize: 18 },
  comingInfo:       { flex: 1 },
  comingType:       { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  comingDate:       { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 1 },
  comingPill:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  comingPillTxt:    { fontSize: 12, fontWeight: "800", color: "#fff" },
  // Tips card
  tipsCard:         { backgroundColor: COLORS.PRIMARY_TINT, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.BORDER, marginBottom: 4 },
  tipsTitle:        { fontSize: 13, fontWeight: "700", color: COLORS.PRIMARY, marginBottom: 10 },
  tipRow:           { flexDirection: "row", gap: 8, marginBottom: 6 },
  tipBullet:        { color: COLORS.PRIMARY, fontWeight: "700", fontSize: 14 },
  tipRowTxt:        { flex: 1, fontSize: 12, color: COLORS.TEXT_PRIMARY, lineHeight: 17 },
  // Upcoming stats
  statsRow:         { flexDirection: "row", gap: 10, marginBottom: 14 },
  statCard:         { flex: 1, backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 12, alignItems: "center", borderTopWidth: 3, elevation: 1 },
  statNum:          { fontSize: 22, fontWeight: "800", color: COLORS.PRIMARY },
  statLabel:        { fontSize: 10, color: COLORS.TEXT_SECONDARY, marginTop: 2, textAlign: "center" },
  // Upcoming card
  upCard:           { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 12, marginBottom: 9, gap: 12, elevation: 2, borderWidth: 1, borderColor: COLORS.BORDER },
  upLeft:           { width: 50, height: 50, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  upMid:            { flex: 1 },
  upType:           { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  upDate:           { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  upMeta:           { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  upMetaTxt:        { fontSize: 11, color: COLORS.TEXT_DISABLED },
  upMetaDot:        { fontSize: 11, color: COLORS.TEXT_DISABLED },
  upPill:           { alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12 },
  upPillNum:        { fontSize: 17, fontWeight: "800", color: "#fff" },
  upPillLbl:        { fontSize: 9, color: "rgba(255,255,255,0.8)" },
  calBtn:           { backgroundColor: COLORS.PRIMARY, borderRadius: 12, paddingVertical: 13, alignItems: "center", marginVertical: 14, flexDirection: "row", justifyContent: "center", gap: 8 },
  calBtnTxt:        { color: "#fff", fontWeight: "700", fontSize: 14 },
  // Calendar
  calNav:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  calNavBtn:        { width: 36, height: 36, backgroundColor: COLORS.SURFACE, borderRadius: 10, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: COLORS.BORDER, elevation: 1 },
  calNavArrow:      { fontSize: 22, color: COLORS.PRIMARY, fontWeight: "700" },
  calMonthTitle:    { fontSize: 16, fontWeight: "800", color: COLORS.TEXT_PRIMARY },
  calMonthSub:      { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  calCard:          { backgroundColor: COLORS.SURFACE, borderRadius: 16, padding: 10, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: COLORS.BORDER },
  calWeekRow:       { flexDirection: "row", marginBottom: 4 },
  calWD:            { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: COLORS.TEXT_SECONDARY, paddingVertical: 4 },
  calGrid:          { flexDirection: "row", flexWrap: "wrap" },
  calCell:          { width: "14.28%", height: 46, alignItems: "center", paddingTop: 5 },
  calCellToday:     { backgroundColor: COLORS.PRIMARY_TINT, borderRadius: 8 },
  calCellSel:       { backgroundColor: COLORS.PRIMARY, borderRadius: 8 },
  calDN:            { fontSize: 13, color: COLORS.TEXT_PRIMARY, fontWeight: "500" },
  calDNToday:       { color: COLORS.PRIMARY, fontWeight: "800" },
  calDNSel:         { color: "#fff", fontWeight: "800" },
  calDNWknd:        { color: COLORS.TEXT_SECONDARY },
  calDots:          { flexDirection: "row", gap: 2, marginTop: 2 },
  calDot:           { width: 5, height: 5, borderRadius: 3 },
  // Selected panel
  selPanel:         { backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: COLORS.PRIMARY, elevation: 2 },
  selPanelHeader:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  selPanelDate:     { fontSize: 13, fontWeight: "800", color: COLORS.PRIMARY },
  selPanelBadge:    { backgroundColor: COLORS.PRIMARY_TINT, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  selPanelBadgeTxt: { fontSize: 11, color: COLORS.PRIMARY, fontWeight: "700" },
  selEmpty:         { flexDirection: "row", alignItems: "center", gap: 10 },
  selEmptyTxt:      { fontSize: 13, color: COLORS.TEXT_SECONDARY },
  selItem:          { flexDirection: "row", alignItems: "center", paddingVertical: 9, borderTopWidth: 1, borderTopColor: COLORS.DIVIDER, borderLeftWidth: 3, paddingLeft: 10 },
  selItemType:      { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  selItemSub:       { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  // Legend
  legend:           { backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.BORDER },
  legendTitle:      { fontSize: 11, fontWeight: "800", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 },
  legendGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  legendItem:       { flexDirection: "row", alignItems: "center", gap: 6, minWidth: "45%" },
  legendDot:        { width: 10, height: 10, borderRadius: 5 },
  legendLbl:        { fontSize: 12, color: COLORS.TEXT_SECONDARY },
  // Summary chips
  sumRow:           { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  sumChip:          { alignItems: "center", backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 12, borderWidth: 1.5, minWidth: 72, elevation: 1 },
  sumCount:         { fontSize: 16, fontWeight: "800", marginTop: 4 },
  sumType:          { fontSize: 10, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  // History
  filterChip:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.BORDER, backgroundColor: COLORS.SURFACE },
  filterChipOn:     { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
  filterChipTxt:    { fontSize: 12, color: COLORS.TEXT_SECONDARY, fontWeight: "500" },
  filterChipTxtOn:  { color: "#fff", fontWeight: "700" },
  histCard:         { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 13, marginBottom: 9, gap: 12, borderLeftWidth: 4, elevation: 1, borderWidth: 1, borderColor: COLORS.BORDER },
  histIcon:         { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  histInfo:         { flex: 1 },
  histType:         { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  histDate:         { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  histArea:         { fontSize: 10, color: COLORS.TEXT_DISABLED, marginTop: 1 },
  histRight:        { alignItems: "center", gap: 4 },
  histCheck:        { width: 28, height: 28, borderRadius: 14, backgroundColor: "#DCFCE7", justifyContent: "center", alignItems: "center" },
  histCheckTxt:     { color: "#16A34A", fontWeight: "800", fontSize: 14 },
  histRecentLbl:    { fontSize: 9, color: COLORS.ACCENT, fontWeight: "700" },
  // Holiday card
  holidayCard:      { backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 14, marginTop: 4, marginBottom: 4, borderWidth: 1, borderColor: COLORS.BORDER, elevation: 1 },
  holidayTop:       { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  holidayIconWrap:  { width: 38, height: 38, borderRadius: 10, backgroundColor: COLORS.PRIMARY_TINT, justifyContent: "center", alignItems: "center" },
  holidayTitle:     { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  holidaySub:       { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 1 },
  holidayRow:       { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.DIVIDER, gap: 10 },
  holidayDot:       { width: 8, height: 8, borderRadius: 4 },
  holidayName:      { fontSize: 12, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  holidayDate:      { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 1 },
  holidayBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  holidayBadgeTxt:  { fontSize: 10, fontWeight: "700" },
});
