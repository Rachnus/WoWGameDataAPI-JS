var APIKey = require('../apikey');
var Cache = require('./cache');

class Realm
{
    constructor()
    {
        this.m_iID = null;
        this.m_szName = null;
        this.m_bOnline = null;
        this.m_bIsTournament = null;
        this.m_szTimeZone = null;
        this.m_szRegion = null;
        this.m_szCategory = null;
        this.m_szType = null;
        this.m_bHasQueue = null;
        this.m_szPopulation = null;
    }
}

const RealmCategory =
{
    //EU
    GERMAN:  'German',
    FRENCH:  'French',
    RUSSIAN: 'Russian',
    SPAINSH: 'Spanish',

    ENGLISH: 'English',

    // NA
    US_WEST: 'US West',
    US_EAST: 'US East',

    // LATIN AMERICA
    BRAZIL:  'Brazil',
    LAN:     'Latin America',

    // OCE
    OCEANIC: 'Oceanic',

    // TW
    TAIWAN: 'Taiwan',

    // KR
    KOREA: 'Korea',
}

const RealmTimezone =
{
    // EU
    PARIS: 'Europe/Paris',

    // NA & LAN
    LOS_ANGELES: 'America/Los_Angeles',
    NEW_YORK: 'America/New_York',

    // OCE
    MELBOURNE: 'Australia/Melbourne',

    // TW
    TAIPEI: 'Asia/Taipei',

    // KR
    SEOUL: 'Asia/Seoul'
}

const RealmPopularity =
{
    OFFLINE: 'OFFLINE',
    LOW:     'LOW',
    MEDIUM:  'MEDIUM',
    HIGH:    'HIGH',
    FULL:    'FULL'
}

const RealmType =
{
    NORMAL: 'NORMAL', // PvE
    PVP:    'PVP',
    PVP_RP: 'PVP_RP',
}

/**
 * Get currently connected realms
 * 
 * @param {Boolean} forceUpdate  - True to force update, no matter how recent it was cached
 * @param {String}  status       - Status type, 'UP' or 'DOWN', empty for both (Online or offline)
 * @param {String}  timezone     - Time zone, leave empty for all
 * @param {String}  orderby      - What field to order by, population.type to order them by population
 * @returns 
 */
function GetRealms(forceUpdate = false, status = '', timezone = '', orderby = '')
{
    const promise = new Promise((resolve, reject) => 
    {
        var subUrl = 'data/wow/search/connected-realm';
        var fullUrl = APIKey.BuildAPIURL(subUrl);
        var param = {
            'status.type':status,
            'realms.timezone':timezone,
            'orderby':orderby,
        };

        var unhashedCacheKey = JSON.stringify({url:fullUrl, params:param});
        var cacheEntry = Cache.DynamicCache.GetBlizzardQuery(unhashedCacheKey);

        if(!forceUpdate && cacheEntry != null && !cacheEntry.NeedsUpdate())
        {
            resolve(new APIKey.BlizzardResponse(cacheEntry.m_RawResult, cacheEntry.m_Data));
            return promise;
        }

        APIKey.Get(subUrl,param
        ).then((result) => 
        {
            if(result.data == null)
            {
                resolve(null);
                return promise;
            }

            if(result.data.errors != null)
            {
                console.log(result.data.errors);
                resolve(null);
                return promise;
            }

            if(result.data.results == null)
            {
                console.log('Could not get results in GetRealm()');
                resolve(null);
                return promise;
            }

            var realmList = [];
            for(var i = 0; i < result.data.results.length; i++)
            {
                var realmStatus = result.data.results[i].data;
                var realmData = realmStatus.realms[0];
    
                var newRealm = new Realm();

                newRealm.m_iID = realmData.id;
                newRealm.m_szName = realmData.name[APIKey.GetLocale()];
                newRealm.m_bIsTournament = realmData.is_tournament;
                newRealm.m_szTimeZone = realmData.timezone;
                newRealm.m_szRegion = realmData.region.name[APIKey.GetLocale()];
                newRealm.m_szCategory = realmData.category[APIKey.GetLocale()];
                newRealm.m_szType = realmData.type.type;

                newRealm.m_bOnline = realmStatus.status.type;
                newRealm.m_bHasQueue = realmStatus.has_queue;
                newRealm.m_szPopulation = realmStatus.population.type;

                realmList.push(newRealm);
            }

            Cache.DynamicCache.CacheBlizzardQuery(realmList, result, unhashedCacheKey, Cache.GetRealmsCacheUpdateInterval());
            resolve(new APIKey.BlizzardResponse(result, realmList));
        });
    })

    return promise;
}

module.exports =
{
    Realm,

    RealmCategory,
    RealmTimezone,
    RealmPopularity,

    GetRealms,
}