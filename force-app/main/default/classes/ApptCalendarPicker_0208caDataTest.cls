@IsTest
private class ApptCalendarPicker_0208caDataTest {
    @IsTest
    static void defaultConstructorYieldsEmptyJson() {
        ApptCalendarPicker_0208caData data = new ApptCalendarPicker_0208caData();
        System.assertEquals('', data.apptCalendarPicker_0208caJSON, 'Default constructor should produce empty JSON.');
    }

    @IsTest
    static void jsonConstructorRoundTripsValue() {
        String payload = '{"hello":"world"}';
        ApptCalendarPicker_0208caData data = new ApptCalendarPicker_0208caData(payload);
        System.assertEquals(payload, data.apptCalendarPicker_0208caJSON, 'JSON constructor should round-trip the value.');
    }
}