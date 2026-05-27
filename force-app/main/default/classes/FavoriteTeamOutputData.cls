@JsonAccess(serializable='always' deserializable='always')
global inherited sharing class FavoriteTeamOutputData {

    @AuraEnabled
    global String favoriteTeamOutputJSON;

    global FavoriteTeamOutputData(String favoriteTeamOutputJSON) {
        this.favoriteTeamOutputJSON = favoriteTeamOutputJSON;
    }

    global FavoriteTeamOutputData() {
        this.favoriteTeamOutputJSON = '';
    }
}
