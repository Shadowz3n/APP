cordova.define('cordova/plugin_list', function(require, exports, module) {
module.exports = [
    {
        "id": "cordova-plugin-facebook.CordovaFacebook",
        "file": "plugins/cordova-plugin-facebook/www/CordovaFacebook.js",
        "pluginId": "cordova-plugin-facebook",
        "clobbers": [
            "CordovaFacebook"
        ]
    },
    {
        "id": "cordova-plugin-googleplus.GooglePlus",
        "file": "plugins/cordova-plugin-googleplus/www/GooglePlus.js",
        "pluginId": "cordova-plugin-googleplus",
        "clobbers": [
            "window.plugins.googleplus"
        ]
    },
    {
        "id": "cordova-plugin-inappbrowser.inappbrowser",
        "file": "plugins/cordova-plugin-inappbrowser/www/inappbrowser.js",
        "pluginId": "cordova-plugin-inappbrowser",
        "clobbers": [
            "cordova.InAppBrowser.open",
            "window.open"
        ]
    },
    {
        "id": "nl.x-services.plugins.socialsharing.SocialSharing",
        "file": "plugins/nl.x-services.plugins.socialsharing/www/SocialSharing.js",
        "pluginId": "nl.x-services.plugins.socialsharing",
        "clobbers": [
            "window.plugins.socialsharing"
        ]
    }
];
module.exports.metadata = 
// TOP OF METADATA
{
    "cordova-plugin-facebook": "0.2.2",
    "cordova-plugin-googleplus": "5.1.1",
    "cordova-plugin-inappbrowser": "1.7.1",
    "cordova-plugin-whitelist": "1.3.2",
    "nl.x-services.plugins.socialsharing": "5.1.1"
};
// BOTTOM OF METADATA
});