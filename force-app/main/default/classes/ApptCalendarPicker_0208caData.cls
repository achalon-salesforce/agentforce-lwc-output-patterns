/**
 * @description Lightning Type backing class for a composed component.
 * Holds JSON payload as a string; the matching LWC parses it into
 * `@api value`.
 */
@JsonAccess(serializable='always' deserializable='always')
global class ApptCalendarPicker_0208caData {

    @AuraEnabled
    global String apptCalendarPicker_0208caJSON;

    global ApptCalendarPicker_0208caData(String apptCalendarPicker_0208caJSON) {
        this.apptCalendarPicker_0208caJSON = apptCalendarPicker_0208caJSON;
    }

    global ApptCalendarPicker_0208caData() {
        this.apptCalendarPicker_0208caJSON = '';
    }
}