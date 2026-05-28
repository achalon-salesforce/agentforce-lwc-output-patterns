/**
 * Returns appointment calendar data to the agent as a Custom Lightning Type.
 *
 * Replace the body of getAvailability() with your real business logic:
 *   - Query Salesforce records (Service Appointments, Events, custom objects)
 *   - Call an external scheduling API
 *   - Filter by user, location, service type, etc.
 *
 * The output is wrapped in ApptCalendarPicker_0208caData, which carries a
 * JSON string the LWC parses on render.
 */
global inherited sharing class ApptCalendarPicker_0208caProvider {

    @InvocableMethod(
        label='Get Appointment Calendar (Apex)'
        description='Returns appointment availability for the calendar picker, sourced from Apex business logic instead of an LLM-generated payload.'
    )
    global static List<Response> getAvailability(List<Request> requests) {
        List<Response> responses = new List<Response>();

        for (Request req : requests) {
            String payload = buildAvailabilityPayload(req);

            Response res = new Response();
            res.options = new ApptCalendarPicker_0208caData(payload);
            responses.add(res);
        }

        return responses;
    }

    /**
     * Build the JSON payload the LWC expects.
     * Demo: contactId personalizes the title, appointmentTypeId varies the slots.
     * Replace this body with a SOQL query or external service call.
     */
    private static String buildAvailabilityPayload(Request req) {
        Date startDate = Date.today();

        // Personalize the title using contactId — looks up the contact's name.
        String greeting = 'Book an Appointment';
        if (req.contactId != null) {
            List<Contact> contacts = [
                SELECT FirstName FROM Contact WHERE Id = :req.contactId LIMIT 1
            ];
            if (!contacts.isEmpty() && String.isNotBlank(contacts[0].FirstName)) {
                greeting = 'Book an Appointment, ' + contacts[0].FirstName;
            }
        }

        // Vary slots by appointmentTypeId so different types produce different availability.
        // Replace with real availability lookup driven by the type's duration/provider rules.
        List<Object> availableDates = slotsForType(req.appointmentTypeId, startDate);

        Map<String, Object> payload = new Map<String, Object>{
            'title' => greeting,
            'subtitle' => 'Appointment type: ' + (req.appointmentTypeId != null ? String.valueOf(req.appointmentTypeId) : '(none)'),
            'confirmLabel' => 'Confirm Booking',
            'availableDates' => availableDates
        };

        return JSON.serialize(payload);
    }

    /**
     * Demo slot generator — different appointment types get different patterns.
     * Replace with your scheduling query / external service call.
     */
    private static List<Object> slotsForType(Id appointmentTypeId, Date startDate) {
        // Use the last char of the ID to pick a pattern — purely so callers can see
        // that passing different appointmentTypeId values produces different output.
        String idStr = appointmentTypeId != null ? String.valueOf(appointmentTypeId) : '';
        String bucket = idStr.length() > 0 ? idStr.substring(idStr.length() - 1) : '';

        if (bucket == '0' || bucket == '1' || bucket == '2' || bucket == '3' || bucket == '4') {
            // Short consultation — more slots per day, narrower window
            return new List<Object>{
                new Map<String, Object>{ 'date' => formatDate(startDate.addDays(1)), 'slots' => new List<String>{ '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM' } },
                new Map<String, Object>{ 'date' => formatDate(startDate.addDays(2)), 'slots' => new List<String>{ '9:00 AM', '9:30 AM', '10:00 AM', '11:30 AM' } },
                new Map<String, Object>{ 'date' => formatDate(startDate.addDays(3)), 'slots' => new List<String>{ '10:00 AM', '10:30 AM', '11:00 AM' } }
            };
        }
        // Long meeting — fewer slots, longer windows
        return new List<Object>{
            new Map<String, Object>{ 'date' => formatDate(startDate.addDays(2)), 'slots' => new List<String>{ '9:00 AM', '1:00 PM' } },
            new Map<String, Object>{ 'date' => formatDate(startDate.addDays(3)), 'slots' => new List<String>{ '10:00 AM', '2:00 PM' } },
            new Map<String, Object>{ 'date' => formatDate(startDate.addDays(5)), 'slots' => new List<String>{ '9:30 AM', '2:30 PM' } }
        };
    }

    private static String formatDate(Date d) {
        return DateTime.newInstance(d.year(), d.month(), d.day()).format('yyyy-MM-dd');
    }

    @JsonAccess(serializable='always' deserializable='always')
    global class Request {
        @InvocableVariable(label='Contact ID' description='ID of the Contact requesting the appointment. Used to personalize the calendar greeting.')
        global Id contactId;

        @InvocableVariable(label='Appointment Type ID' description='ID of the appointment type. Drives which time slots are available.')
        global Id appointmentTypeId;
    }

    @JsonAccess(serializable='always' deserializable='always')
    global class Response {
        @InvocableVariable(label='Options' description='Calendar payload to render in the chat.')
        global ApptCalendarPicker_0208caData options;
    }
}
