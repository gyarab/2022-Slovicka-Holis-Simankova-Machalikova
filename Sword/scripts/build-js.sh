#!/bin/bash

SWORD_CORE=(
    Sword/custom-elements/custom-elements-polyfill.min.js
    Sword/custom-elements/customElements.js
	Sword/Sword.js
	Sword/widgets/form.js
    Sword/widgets/complex-widgets.js
	Sword/widgets/smarttable.js
	Sword/widgets/widgets.js
	Sword/widgets/popupmanager.js
	Sword/widgets/svg-widgets.js
	Sword/utils/REST.js
	Sword/utils/Application.js
	Sword/utils/Errors.js
	Sword/utils/Notifications.js
	Sword/utils/Router.js
	Sword/utils/utils.js
	Sword/utils/Data.js
	Sword/utils/i18n/i18next.min.js
	Sword/Startup.js
	Sword/widgets/Screens.js
)

MAIN_PKG=(
    node_modules/confetti-js/dist/index.min.js
    node_modules/chart.js/dist/chart.umd.js
	"${SWORD_CORE[@]}"
	fe/I18n.js
    fe/Data.js
    fe/Forms.js
	fe/Statistics.js
    fe/MyProfile.js
    node_modules/socket.io/client-dist/socket.io.js
    fe/Administration.js
    fe/Courses.js
    fe/Adventures.js
	fe/main.js
)

npx uglifyjs --source-map includeSources,url=main.build.js.map "${MAIN_PKG[@]}" -o gen/fe/main.build.js