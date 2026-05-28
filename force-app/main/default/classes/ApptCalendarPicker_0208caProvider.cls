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
     * Replace this with a SOQL query or external service call.
     */
    private static String buildAvailabilityPayload(Request req) {
        Date startDate = req.startDate != null ? req.startDate : Date.today();

        Map<String, Object> payload = new Map<String, Object>{
            'title' => String.isNotBlank(req.title) ? req.title : 'Book an Appointment',
            'subtitle' => String.isNotBlank(req.subtitle) ? req.subtitle : 'Choose a date and time that works for you.',
            'confirmLabel' => 'Confirm Booking',
            'availableDates' => new List<Map<String, Object>>{
                new Map<String, Object>{
                    'date' => formatDate(startDate.addDays(1)),
                    'slots' => new List<String>{ '9:00 AM', '10:30 AM', '2:00 PM', '3:30 PM' }
                },
                new Map<String, Object>{
                    'date' => formatDate(startDate.addDays(2)),
                    'slots' => new List<String>{ '8:30 AM', '11:00 AM', '1:00 PM' }
                },
                new Map<String, Object>{
                    'date' => formatDate(startDate.addDays(3)),
                    'slots' => new List<String>{ '10:00 AM', '12:00 PM', '4:00 PM' }
                },
                new Map<String, Object>{
                    'date' => formatDate(startDate.addDays(5)),
                    'slots' => new List<String>{ '9:30 AM', '2:30 PM' }
                }
            }
        };

        return JSON.serialize(payload);
    }

    private static String formatDate(Date d) {
        return DateTime.newInstance(d.year(), d.month(), d.day()).format('yyyy-MM-dd');
    }

    @JsonAccess(serializable='always' deserializable='always')
    global class Request {
        @InvocableVariable(label='Title' description='Optional override for the calendar heading.')
        global String title;

        @InvocableVariable(label='Subtitle' description='Optional override for the calendar subtitle.')
        global String subtitle;

        @InvocableVariable(label='Start Date' description='Optional date to begin availability search from. Defaults to today.')
        global Date startDate;
    }

    @JsonAccess(serializable='always' deserializable='always')
    global class Response {
        @InvocableVariable(label='Options' description='Calendar payload to render in the chat.')
        global ApptCalendarPicker_0208caData options;
    }
}
