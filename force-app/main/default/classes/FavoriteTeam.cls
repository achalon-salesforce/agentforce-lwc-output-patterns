@JsonAccess(serializable='always' deserializable='always')
global inherited sharing class FavoriteTeam {

    @AuraEnabled
    global String teamName;
}
