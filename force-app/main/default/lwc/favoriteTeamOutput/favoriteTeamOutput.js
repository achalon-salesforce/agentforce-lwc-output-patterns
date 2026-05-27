import { LightningElement, api } from 'lwc';

function sendUtterance(message) {
    try {
        if (typeof embeddedservice_configuration !== 'undefined'
            && embeddedservice_configuration
            && embeddedservice_configuration.util
            && embeddedservice_configuration.util.sendTextMessage) {
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

const ENVELOPE_FIELD = 'favoriteTeamOutputJSON';
const BUILDER_FALLBACK = '{"title":"Your Favorite Team","subtitle":"Here\'s what we have on file for you.","teamName":"Golden State Warriors","message":"Customer\'s favorite sports team is Golden State Warriors"}';

function unwrap(raw) {
    if (raw == null) return null;
    if (typeof raw !== 'object') return null;
    if (ENVELOPE_FIELD in raw) {
        const json = raw[ENVELOPE_FIELD];
        if (typeof json === 'string' && json.trim()) {
            try { return JSON.parse(json); } catch (_) { return null; }
        }
        return null;
    }
    const keys = Object.keys(raw);
    if (keys.length === 1 && keys[0] === 'value' && raw.value && typeof raw.value === 'object') {
        return raw.value;
    }
    return raw;
}

export default class FavoriteTeamOutput extends LightningElement {
    _value;
    data = {};
    saved = false;

    @api
    get value() { return this._value; }
    set value(v) {
        this._value = v;
        const parsed = unwrap(v) || JSON.parse(BUILDER_FALLBACK);
        this.data = parsed;
    }

    handleSaveToProfile() {
        this.saved = true;
        sendUtterance('I just updated my favorite sports team to ' + this.data.teamName);
    }
}
