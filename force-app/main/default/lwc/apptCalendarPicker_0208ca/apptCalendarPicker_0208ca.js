import { LightningElement, api, track } from 'lwc';


const __APEX_ENVELOPE_FIELD = "apptCalendarPicker_0208caJSON";
function __peelValueWrapper(parsed) {
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    var __keys = Object.keys(parsed);
    if (__keys.length === 1 && __keys[0] === 'value' && parsed.value && typeof parsed.value === 'object') {
      return parsed.value;
    }
  }
  return parsed;
}
function __unwrapApexEnvelope(raw) {
  if (raw == null) return raw;
  if (typeof raw !== 'object') return raw;
  if (!(__APEX_ENVELOPE_FIELD in raw)) return __peelValueWrapper(raw);
  var __field = raw[__APEX_ENVELOPE_FIELD];
  if (typeof __field === 'string' && __field.trim()) {
    try { return __peelValueWrapper(JSON.parse(__field)); }
    catch (_err) { return null; }
  }
  return null;
}
const BUILDER_FALLBACK_JSON = "{\"title\":\"Book an Appointment\",\"subtitle\":\"Choose a date and time that works for you.\",\"confirmLabel\":\"Confirm Booking\",\"availableDates\":[{\"date\":\"2026-05-27\",\"slots\":[\"9:00 AM\",\"10:00 AM\",\"11:30 AM\",\"2:00 PM\",\"3:30 PM\"]},{\"date\":\"2026-05-28\",\"slots\":[\"8:30 AM\",\"10:30 AM\",\"1:00 PM\",\"4:00 PM\"]},{\"date\":\"2026-05-29\",\"slots\":[\"9:00 AM\",\"11:00 AM\",\"2:30 PM\"]},{\"date\":\"2026-05-31\",\"slots\":[\"10:00 AM\",\"12:00 PM\",\"3:00 PM\",\"4:30 PM\"]},{\"date\":\"2026-06-01\",\"slots\":[\"9:30 AM\",\"11:30 AM\",\"1:30 PM\"]},{\"date\":\"2026-06-02\",\"slots\":[\"8:00 AM\",\"10:00 AM\",\"2:00 PM\",\"3:30 PM\",\"5:00 PM\"]}]}";
let __builderFallbackParsed;
function __getBuilderFallback() {
  if (__builderFallbackParsed !== undefined) return __builderFallbackParsed;
  if (BUILDER_FALLBACK_JSON && BUILDER_FALLBACK_JSON !== '__BUILDER_FALLBACK_PAYLOAD__') {
    try { __builderFallbackParsed = JSON.parse(BUILDER_FALLBACK_JSON); }
    catch (_err) { __builderFallbackParsed = null; }
  } else {
    __builderFallbackParsed = null;
  }
  return __builderFallbackParsed;
}

function sendUtterance(message) {
  try {
    if (typeof embeddedservice_configuration !== 'undefined'
        && embeddedservice_configuration && embeddedservice_configuration.util && embeddedservice_configuration.util.sendTextMessage) {
      embeddedservice_configuration.util.sendTextMessage(message).catch(function(err) {
        console.error('sendUtterance failed:', err);
      });
    } else {
      console.log('sendUtterance (preview):', message);
    }
  } catch (err) {
    console.error('sendUtterance threw:', err);
  }
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

const WEEK_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default class ApptCalendarPicker extends LightningElement {
  _value;
  @api
  get value() { return this._value != null ? this._value : __getBuilderFallback(); }
  set value(v) { this._value = __unwrapApexEnvelope(v); }

  @track _viewYear = null;
  @track _viewMonth = null;
  @track selectedDateISO = null;
  @track selectedTime = null;

  get availableDates() {
    return (this.value && this.value.availableDates) || [];
  }

  get weekDayLabels() {
    return WEEK_DAYS;
  }

  _ensureViewInit() {
    if (this._viewYear === null || this._viewMonth === null) {
      const dates = this.availableDates;
      if (dates && dates.length > 0 && dates[0].date) {
        const parts = dates[0].date.split('-');
        this._viewYear = parseInt(parts[0], 10);
        this._viewMonth = parseInt(parts[1], 10) - 1;
      } else {
        const now = new Date();
        this._viewYear = now.getFullYear();
        this._viewMonth = now.getMonth();
      }
    }
  }

  get currentMonthLabel() {
    this._ensureViewInit();
    return MONTH_NAMES[this._viewMonth] + ' ' + this._viewYear;
  }

  get _availableDateMap() {
    const map = {};
    const dates = this.availableDates;
    for (let i = 0; i < dates.length; i++) {
      const entry = dates[i];
      if (entry && entry.date) {
        map[entry.date] = entry.slots || [];
      }
    }
    return map;
  }

  get calendarDays() {
    this._ensureViewInit();
    const year = this._viewYear;
    const month = this._viewMonth;
    const availMap = this._availableDateMap;

    const today = new Date();
    const todayISO = today.getFullYear() + '-'
      + String(today.getMonth() + 1).padStart(2, '0') + '-'
      + String(today.getDate()).padStart(2, '0');

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];

    for (let e = 0; e < firstDay; e++) {
      cells.push({
        key: 'empty-' + e,
        dateISO: '',
        dateNum: '',
        cellClass: 'cal-day empty',
        hasSlots: false
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const iso = year + '-'
        + String(month + 1).padStart(2, '0') + '-'
        + String(d).padStart(2, '0');

      const isAvailable = !!availMap[iso];
      const isSelected = iso === this.selectedDateISO;
      const isToday = iso === todayISO;

      let cellClass = 'cal-day';
      if (isSelected) {
        cellClass += ' selected';
      } else if (isAvailable) {
        cellClass += ' available';
      } else {
        cellClass += ' unavailable';
      }
      if (isToday) {
        cellClass += ' today';
      }

      cells.push({
        key: iso,
        dateISO: iso,
        dateNum: d,
        cellClass: cellClass,
        hasSlots: isAvailable
      });
    }

    return cells;
  }

  get selectedDateLabel() {
    if (!this.selectedDateISO) return null;
    const parts = this.selectedDateISO.split('-');
    if (parts.length !== 3) return this.selectedDateISO;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  get slotsForSelectedDate() {
    if (!this.selectedDateISO) return [];
    const map = this._availableDateMap;
    const slots = map[this.selectedDateISO] || [];
    return slots.map(function(t) {
      return {
        time: t,
        slotClass: 'time-slot'
      };
    });
  }

  get noSlotsMessage() {
    if (!this.selectedDateISO) return null;
    const map = this._availableDateMap;
    const slots = map[this.selectedDateISO];
    if (slots && slots.length > 0) return null;
    return 'No available times for this date.';
  }

  handlePrevMonth() {
    this._ensureViewInit();
    if (this._viewMonth === 0) {
      this._viewMonth = 11;
      this._viewYear = this._viewYear - 1;
    } else {
      this._viewMonth = this._viewMonth - 1;
    }
  }

  handleNextMonth() {
    this._ensureViewInit();
    if (this._viewMonth === 11) {
      this._viewMonth = 0;
      this._viewYear = this._viewYear + 1;
    } else {
      this._viewMonth = this._viewMonth + 1;
    }
  }

  handleDateClick(event) {
    const dateISO = event.currentTarget.dataset.date;
    if (!dateISO) return;
    const map = this._availableDateMap;
    if (!map[dateISO]) return;
    this.selectedDateISO = dateISO;
    this.selectedTime = null;
  }

  handleTimeClick(event) {
    const time = event.currentTarget.dataset.time;
    if (!time) return;
    this.selectedTime = time;
  }

  handleConfirm() {
    if (!this.selectedDateISO || !this.selectedTime) return;
    const label = this.selectedDateLabel;
    const msg = 'I\'d like an appointment on ' + label + ' at ' + this.selectedTime;
    sendUtterance(msg);
  }
}