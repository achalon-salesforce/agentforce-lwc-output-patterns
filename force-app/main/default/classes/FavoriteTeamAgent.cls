global inherited sharing class FavoriteTeamAgent {

    @InvocableMethod(label='Save Favorite Team' description='Saves the user\'s favorite sports team to the Acme account description')
    global static List<FavoriteTeamResponse> saveFavoriteTeam(List<FavoriteTeamRequest> requests) {
        List<FavoriteTeamResponse> responses = new List<FavoriteTeamResponse>();

        User currentUser = new User(Id = UserInfo.getUserId());

        for (FavoriteTeamRequest req : requests) {
            String teamName = req.filters != null ? req.filters.teamName : '';
            currentUser.AboutMe = 'Customer\'s favorite sports team is ' + teamName;

            FavoriteTeamResponse res = new FavoriteTeamResponse();
            res.message = 'Got it! I\'ve noted your favorite team as ' + teamName + '.';
            responses.add(res);
        }

        update currentUser;

        return responses;
    }

    @AuraEnabled
    global static void saveToProfile(String teamName) {
        new ProfileWriter().write(teamName);
    }

    without sharing class ProfileWriter {
        void write(String teamName) {
            update new User(
                Id = UserInfo.getUserId(),
                AboutMe = 'Customer\'s favorite sports team is ' + teamName
            );
        }
    }

    @JsonAccess(serializable='always' deserializable='always')
    global class FavoriteTeamRequest {

        @InvocableVariable(required=true label='Team Filters' description='User-provided team preference')
        global FavoriteTeam filters;
    }

    @JsonAccess(serializable='always' deserializable='always')
    global class FavoriteTeamResponse {

        @InvocableVariable(label='Message' description='Confirmation message')
        global String message;
    }
}
