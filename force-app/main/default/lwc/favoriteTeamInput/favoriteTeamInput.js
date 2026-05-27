import { api, LightningElement } from 'lwc';
import saveToProfile from '@salesforce/apex/FavoriteTeamAgent.saveToProfile';

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

export default class FavoriteTeamInput extends LightningElement {

    @api
    get readOnly() {
        return this._readOnly;
    }
    set readOnly(value) {
        this._readOnly = value;
    }
    _readOnly = false;
    _value;

    @api
    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
    }

    teamName = '';
    saving = false;
    saved = false;

    connectedCallback() {
        if (this.value) {
            this.teamName = this.value?.teamName || '';
        }
    }

    get hasTeamName() {
        return this.teamName && this.teamName.trim().length > 0;
    }

    handleInputChange(event) {
        event.stopPropagation();
        this.teamName = event.target.value;
        this.saved = false;
    }

    handleSaveToProfile() {
        if (!this.hasTeamName || this.saving) return;
        this.saving = true;
        const team = this.teamName.trim();
        saveToProfile({ teamName: team })
            .then(() => {
                this.saved = true;
                this.saving = false;
                sendUtterance('I just updated my favorite sports team to ' + team);
            })
            .catch(err => {
                console.error('saveToProfile failed:', err);
                this.saving = false;
            });
    }

    handleConfirm() {
        if (!this.hasTeamName) return;

        this.dispatchEvent(new CustomEvent('valuechange', {
            detail: {
                value: {
                    teamName: this.teamName.trim()
                }
            }
        }));

        sendUtterance('Got it! I\'ve noted your favorite team as ' + this.teamName.trim() + '.');
    }
}
