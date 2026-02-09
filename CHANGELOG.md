# Changelog

## [0.3.0](https://github.com/EpiTrello-Organisation/EpiTrello/compare/v0.2.0...v0.3.0) (2026-02-09)


### Features

* **Board:** implement board backgroud support linked to backend -- working ([db6c6c0](https://github.com/EpiTrello-Organisation/EpiTrello/commit/db6c6c0180157524a22137dea6bc30a2f5cb3d9c))
* **card:** overhaul of description, implement tiptap text editor ([9636cda](https://github.com/EpiTrello-Organisation/EpiTrello/commit/9636cda8539ff680efe8574a2253cb2b17f8191a))
* **filter:** implement filter members cards ([ceed234](https://github.com/EpiTrello-Organisation/EpiTrello/commit/ceed234adfcf98eb335d3633e068176104b694ad))
* **filtermembermodal:** implement filter by member with its tests ([2d41439](https://github.com/EpiTrello-Organisation/EpiTrello/commit/2d41439f6106af1f4f818bd416b8655fb4a0098b))
* **labels:** implement labels linked to backend ([c3570eb](https://github.com/EpiTrello-Organisation/EpiTrello/commit/c3570ebf1fbfdbc396b3c018fefaa0f75a3a0a92))
* **labels:** remove every secondary elements ([9494bfb](https://github.com/EpiTrello-Organisation/EpiTrello/commit/9494bfbfd2150bc1969c40b681b5962b7a006c10))
* **members:** add other boards page for non owner boards ([4f97fd3](https://github.com/EpiTrello-Organisation/EpiTrello/commit/4f97fd3e2d4f168349cbc2429873226284c5383d))
* **members:** add share board menu ([a9269fb](https://github.com/EpiTrello-Organisation/EpiTrello/commit/a9269fbdefa49d71835734364776c7f478086679))
* **members:** implement delete member working ([112d73c](https://github.com/EpiTrello-Organisation/EpiTrello/commit/112d73cf6ef7f754128c0c0d997dd53534e9afe5))
* **members:** implement share board working + list all current members ([9bf9d9b](https://github.com/EpiTrello-Organisation/EpiTrello/commit/9bf9d9b87362cd2b72ab7befcabb4341c7165d6d))
* **topbar:** search engine finally working + createboardmodal ([bf5e109](https://github.com/EpiTrello-Organisation/EpiTrello/commit/bf5e1092af41feea3d59d8f16f63d1cdc8aff4bb))


### Bug Fixes

* **backgrounf:** fix overflow horizontal white background ([673f8a3](https://github.com/EpiTrello-Organisation/EpiTrello/commit/673f8a3b23656a46c7b4addfab597fc2bbe97dfc))
* **boardtopbar:** remove visibility and placeholer members ([3711f20](https://github.com/EpiTrello-Organisation/EpiTrello/commit/3711f20448577c5cdb38ddeb96e109d8233b8dc8))
* **carmodal:** remove Dates and Checklists ([d82b744](https://github.com/EpiTrello-Organisation/EpiTrello/commit/d82b744a6a7f7ab0db718dc5d9c0524b5292b9af))
* **homepage:** remove homepage, '/' redirects now to /boards ([2adcb88](https://github.com/EpiTrello-Organisation/EpiTrello/commit/2adcb8895da74d92c961e4bf7859d1a7e9f5d7d4))
* **members invite:** update useMember hook to match both card-members and board-memberrs ([68f69b5](https://github.com/EpiTrello-Organisation/EpiTrello/commit/68f69b540936253a3d80909b9d66440ddb258597))
* **template:** remove template button ([a78f8c7](https://github.com/EpiTrello-Organisation/EpiTrello/commit/a78f8c7bca609f5435a9c07430b18e640d7aa686))


### Tests

* **backend:** add auth register and login endpoint tests ([f0f35a9](https://github.com/EpiTrello-Organisation/EpiTrello/commit/f0f35a93da2dc69f482d800a7e100e3aca4e375b))
* **backend:** add board members endpoint tests ([ef4a0a8](https://github.com/EpiTrello-Organisation/EpiTrello/commit/ef4a0a8ba356427917bc124da35186217ff7e90d))
* **backend:** add boards CRUD endpoint tests ([750187d](https://github.com/EpiTrello-Organisation/EpiTrello/commit/750187d45c450e3e4aa43bef90fae8c5edfac84d))
* **backend:** add card members endpoint tests ([c2774a6](https://github.com/EpiTrello-Organisation/EpiTrello/commit/c2774a6636a7e8ed2a644924f0d47ab3ab15fc53))
* **backend:** add cards CRUD endpoint tests ([3c7b167](https://github.com/EpiTrello-Organisation/EpiTrello/commit/3c7b16730ca894ede988b9d222679660c6bc1ab3))
* **backend:** add dependency injection and authorization tests ([c9e28e5](https://github.com/EpiTrello-Organisation/EpiTrello/commit/c9e28e549a3d6f6e0f5bbd5b07968a626c43244a))
* **backend:** add lists CRUD endpoint tests ([11457c2](https://github.com/EpiTrello-Organisation/EpiTrello/commit/11457c258fd397ea40a104b223c1a3db08df9e53))
* **backend:** add password hashing and JWT token tests ([922f4bf](https://github.com/EpiTrello-Organisation/EpiTrello/commit/922f4bfed8a4f872c9703140b4fe3676cbde3cad))
* **backend:** add root endpoint test ([a89f9f1](https://github.com/EpiTrello-Organisation/EpiTrello/commit/a89f9f1730b3403a4bcd9e22ba770ea222e4b546))
* **backend:** add SQLAlchemy model tests for all entities ([07f2441](https://github.com/EpiTrello-Organisation/EpiTrello/commit/07f244124214ca84f84834f7883b40b791bb567e))
* **backend:** add test infrastructure with SQLite fixtures and helpers ([ecf58cd](https://github.com/EpiTrello-Organisation/EpiTrello/commit/ecf58cd3422102c957887ac8fb0acafdc8b75289))
* **backend:** add users me endpoint tests ([92a4500](https://github.com/EpiTrello-Organisation/EpiTrello/commit/92a4500418ed5f5636260216224cbcf91f3fb6af))
* **board-backgrounds:** update tests ([2287486](https://github.com/EpiTrello-Organisation/EpiTrello/commit/22874860d90e187790845ced9be1bb80c5d68ad8))
* **coverage:** increase coverage ([9243f2d](https://github.com/EpiTrello-Organisation/EpiTrello/commit/9243f2dd937ce3d0551b7fcdf6e145085444e0ba))
* **coverage:** increase coverage overhaul ([c085b2e](https://github.com/EpiTrello-Organisation/EpiTrello/commit/c085b2ed9859ab626c6f5b8f47976593c2de2b2a))
* **e2e:** add e2e tests set for frontend ([2f5415e](https://github.com/EpiTrello-Organisation/EpiTrello/commit/2f5415ed76090c7d5211ad022293ae07ec3ac9cd))
* **e2e:** implement e2e tests set ([bdd56ff](https://github.com/EpiTrello-Organisation/EpiTrello/commit/bdd56ff00b3efcbfeee68eccfbd31719ddc19f82))
* **LabelsPopover:** update tests for new frontend ([d99d633](https://github.com/EpiTrello-Organisation/EpiTrello/commit/d99d6339baae9498ddb049b8114d88a2ddaf40da))
* **labels:** update tests sets for mew labels_id variable ([d11e97f](https://github.com/EpiTrello-Organisation/EpiTrello/commit/d11e97f214df40ce29fac06653575b4dafafbd81))
* **member:** add tests set to accomodate new members invites ([250998e](https://github.com/EpiTrello-Organisation/EpiTrello/commit/250998e0ce41175c893fa45282eb7b73f5311fa4))
* **topbar:** bring back coverage above thresholds ([a732b75](https://github.com/EpiTrello-Organisation/EpiTrello/commit/a732b752ce362a2e25977af4736eda7e03620f78))


### Build System

* **backend:** add pytest and coverage configuration ([c970ff4](https://github.com/EpiTrello-Organisation/EpiTrello/commit/c970ff4279ac097c4723c71cd6949f353a02cc6b))


### Continuous Integration

* **backend:** add backend CI job with lint, format check and tests ([c0e7535](https://github.com/EpiTrello-Organisation/EpiTrello/commit/c0e753505a381f9e6f875ec9522ddbfa894b746b))
* **release:** add ui/ux to changelog-sections ([46cf166](https://github.com/EpiTrello-Organisation/EpiTrello/commit/46cf1663cb49d626481d029bb23112600166f088))
* **release:** implement GHCR image push to public, waiting for another release to activate it ([1976010](https://github.com/EpiTrello-Organisation/EpiTrello/commit/1976010198950663638f0f315e78083f24fa5fec))


### Chores

* configure ruff linter/formatter and apply fixes across backend ([d86fdfa](https://github.com/EpiTrello-Organisation/EpiTrello/commit/d86fdfa2404eee2e3bd33d9b5552e99355410e64))
* **format:** run format prettier ([23d0864](https://github.com/EpiTrello-Organisation/EpiTrello/commit/23d0864ee480f155f1872271625c0756f00657fe))


### User interface / User experience

* **BoardPage:** remove unecessary css ([54cfcbd](https://github.com/EpiTrello-Organisation/EpiTrello/commit/54cfcbd9efaad39fcb7f035cba00115556dd23e4))
* **profile:** add user icon to button ([3cb312d](https://github.com/EpiTrello-Organisation/EpiTrello/commit/3cb312df1f6cb2acfb2b3ef8584a9e422de1d8d8))
* **theme:** implement dark-theme for addcardcomposer component ([3d9663b](https://github.com/EpiTrello-Organisation/EpiTrello/commit/3d9663b1e4c9658fb0344c2b948b73b4043689e1))
* **theme:** implement dark-theme for addlistcomposer component ([fc1b31a](https://github.com/EpiTrello-Organisation/EpiTrello/commit/fc1b31a43f0922046b9896b5636aac4b19f18191))
* **theme:** implement dark-theme for boardcard component ([be9299d](https://github.com/EpiTrello-Organisation/EpiTrello/commit/be9299d6d780689b7cfcf7e093fba63448a67200))
* **theme:** implement dark-theme for boardlist component ([f45bfd6](https://github.com/EpiTrello-Organisation/EpiTrello/commit/f45bfd6d2ee4fc21da70fa837d0423582e546e66))
* **theme:** implement dark-theme for boardtopbar component ([ec45f43](https://github.com/EpiTrello-Organisation/EpiTrello/commit/ec45f43edad18da23a12b488760b02fa715cac09))
* **theme:** implement dark-theme for cardmodal component ([d4c4e79](https://github.com/EpiTrello-Organisation/EpiTrello/commit/d4c4e7995ecb97e1f043120ae77f06bde562cdda))
* **theme:** implement dark-theme for createboardmodal component ([c75f8fe](https://github.com/EpiTrello-Organisation/EpiTrello/commit/c75f8fe87f5e1ae39c30e57b18c7dc92bc4b5183))
* **theme:** implement dark-theme for labelspopover component ([4f88144](https://github.com/EpiTrello-Organisation/EpiTrello/commit/4f88144e58f63e9f64e2cc0663fb267a8e884f23))
* **theme:** implement dark-theme for loginpage component ([865518d](https://github.com/EpiTrello-Organisation/EpiTrello/commit/865518dc091a59cba489f9b6997dce93cb816f7a))
* **theme:** implement dark-theme for richtexteditor component ([96e76b2](https://github.com/EpiTrello-Organisation/EpiTrello/commit/96e76b2d1c23af36061799f662f87043eae98baf))
* **theme:** implement dark-theme for sidebar component ([f44c8ac](https://github.com/EpiTrello-Organisation/EpiTrello/commit/f44c8ac0c72d3576e3d39f4ac0e3bd0a84ef6170))
* **theme:** implement dark-theme for signuppage component ([9375a4b](https://github.com/EpiTrello-Organisation/EpiTrello/commit/9375a4b4b3e22d0552dc6bcb9bc2e143a71dfe3e))
* **theme:** implement dark-theme for topbar component ([6e36a1d](https://github.com/EpiTrello-Organisation/EpiTrello/commit/6e36a1dc7b40671b385227c4d348a9d21cd2d97e))
* **theme:** implement light-theme and fix every color to match both dark and light themes ([74c7fa1](https://github.com/EpiTrello-Organisation/EpiTrello/commit/74c7fa14e4a01d83c7268f00b6f84fe308e141bd))
* **theme:** implement theme variables with begining of dark theme ([7a99ecc](https://github.com/EpiTrello-Organisation/EpiTrello/commit/7a99ecc7b17d99545c5276e377ad5bd7c3c4af27))

## [0.2.0](https://github.com/EpiTrello-Organisation/EpiTrello/compare/v0.1.0...v0.2.0) (2026-02-05)


### Features

* **authentication:** add basic authentication system ([a263759](https://github.com/EpiTrello-Organisation/EpiTrello/commit/a263759509fba614309d7a5a5c5258d28606631e))
* **authentication:** add basic authentication system ([67a26cd](https://github.com/EpiTrello-Organisation/EpiTrello/commit/67a26cdda741d2d55fed61a224d3281d58d4c38b))
* **board-list-card:** add card composer and close on pointer down for card and list composer ([3a379df](https://github.com/EpiTrello-Organisation/EpiTrello/commit/3a379df357c451ee2727eb5dc407b9e5ce5037db))
* **board:** add basic board page with lists fetched from API ([3aae9aa](https://github.com/EpiTrello-Organisation/EpiTrello/commit/3aae9aa842d1fc3b00cf53b4feb04ff54b42c42d))
* **board:** implement placeholder topbar for boardpage ([8cc0dfa](https://github.com/EpiTrello-Organisation/EpiTrello/commit/8cc0dfa42ee994bb600bbc06720484f9fcefdb3e))
* **board:** implement title modification/update trough PUT ([a92f6d6](https://github.com/EpiTrello-Organisation/EpiTrello/commit/a92f6d680b6e954e5ff2a9e015a38364aa9f83e5))
* **board:** implement working board DELETE in 3dot menu modal of BoardTopBar ([2e460c5](https://github.com/EpiTrello-Organisation/EpiTrello/commit/2e460c5f6371c5e0d794e19c0484e9b118aab97c))
* **boards:** add compact create board modal with background selection and validation ([e569e11](https://github.com/EpiTrello-Organisation/EpiTrello/commit/e569e119fd7da67533471b0787b86cbb1c8d330f))
* **boards:** add topbar, sidebar navigation, and Boards/Templates pages ([2c52449](https://github.com/EpiTrello-Organisation/EpiTrello/commit/2c5244962ee82995db5901010e23e6f1e25f4b5c))
* **boards:** create board via modal and redirect to board page ([70d0e5d](https://github.com/EpiTrello-Organisation/EpiTrello/commit/70d0e5d428aeca25176013771241b3ccaf2ad519))
* **card:** add 4 action buttons 'Labels, Dates, Checklist, Members' to card modal. Not working yet ([3da5001](https://github.com/EpiTrello-Organisation/EpiTrello/commit/3da5001fd26f8db6f02b51e2faddf1c1d1d6adc2))
* **card:** add Labels feature on cards. only frontend ([1b2192d](https://github.com/EpiTrello-Organisation/EpiTrello/commit/1b2192df4f7036e42109a7f798f2e06a87ad0cf5))
* **card:** card dnd fully working with intra/inter lists and backend link ([1e5cc24](https://github.com/EpiTrello-Organisation/EpiTrello/commit/1e5cc24b9821376c6d97906f43b6dd759476d7f5))
* **card:** display card content in a modal ([e3faceb](https://github.com/EpiTrello-Organisation/EpiTrello/commit/e3facebfa847422fd430c813be84ce7479d42c4c))
* **card:** fetch and display cards on arrival ([1a80b66](https://github.com/EpiTrello-Organisation/EpiTrello/commit/1a80b6616bdd3a47694f9e85935c6d62fca72f8b))
* **card:** implement DELETE request and title PUT ([dd21655](https://github.com/EpiTrello-Organisation/EpiTrello/commit/dd21655c9f326a9cb85689232f4b20dee1239d96))
* **card:** implement dnd and position PUT update with UI/UX ([d0778e0](https://github.com/EpiTrello-Organisation/EpiTrello/commit/d0778e00091ab5355f1ff653b3412220755f1407))
* **complete-profile:** display verified email in read-only mode and add account creation logic (navigation to /kanban) ([d3c28cf](https://github.com/EpiTrello-Organisation/EpiTrello/commit/d3c28cf373d573b9c272b0efd73753fe27318d2c))
* **dnd:** implement drag and drop for lists ([fd8b610](https://github.com/EpiTrello-Organisation/EpiTrello/commit/fd8b610bd730afb0f5b6263a3e5d13fcb0b850b5))
* **list:** implement list creation aith API call ([a4c1841](https://github.com/EpiTrello-Organisation/EpiTrello/commit/a4c184185195737127e824083af01656edf43ba7))
* **list:** implement working list DELETE in 3dot menu modal ([93dd187](https://github.com/EpiTrello-Organisation/EpiTrello/commit/93dd18745223ba312adddc03fc25159b2f40397e))
* **list:** update title with backend PUT ([dae1190](https://github.com/EpiTrello-Organisation/EpiTrello/commit/dae1190828433dcac6c3206fb5262895ea1b8e03))
* **logout:** implement logout by removing jwt token and redirecting to /login ([f8b386e](https://github.com/EpiTrello-Organisation/EpiTrello/commit/f8b386eb2ae275b5e87cef95950ab2df22308833))
* **sign-up/log-in:** implement basic sign-up and log in page with no logic ([2cb8079](https://github.com/EpiTrello-Organisation/EpiTrello/commit/2cb8079c47d47a448f9b1408b76bc4d080e13510))
* **sign-up:** implement homepage and sign-up page skeletons with react-router ([31f1c60](https://github.com/EpiTrello-Organisation/EpiTrello/commit/31f1c602a354934f0026c68cc922165d4ef10d01))
* **signup-login:** change UI to match backend ([cb6f78f](https://github.com/EpiTrello-Organisation/EpiTrello/commit/cb6f78f44bcf886db70a78fa007c200238c297fb))
* **signup:** add email existence check with loading and error handling ([07d305d](https://github.com/EpiTrello-Organisation/EpiTrello/commit/07d305d9846b328c627a160ef46f4abc0d13e4db))
* **theme:** prevent flashbang when changing something theme related ([dbada12](https://github.com/EpiTrello-Organisation/EpiTrello/commit/dbada12d0ddc649902d3bdb46562feb3da55f453))
* **UI/UX:** change black 3dot to white ([aba829d](https://github.com/EpiTrello-Organisation/EpiTrello/commit/aba829d5f2475546800dd0133e2ed8450d77581e))
* **UI/UX:** hover effet on  card ([bf8accc](https://github.com/EpiTrello-Organisation/EpiTrello/commit/bf8acccce25d466d9dce83ac4df99157dc24a74b))
* **UI/UX:** remove description of card in list and move card modal display to the top of the screen ([f7dc8cd](https://github.com/EpiTrello-Organisation/EpiTrello/commit/f7dc8cd4189492102ee45b05b0ff48e9405c79ad))
* **verify-code:** add verify code page and navigate from signup with email state ([cc7db3c](https://github.com/EpiTrello-Organisation/EpiTrello/commit/cc7db3c538f563db22e2bbcee3e3785c1952bff4))
* **verify-code:** Added simulated code checking with loading and error handling ([eba6a62](https://github.com/EpiTrello-Organisation/EpiTrello/commit/eba6a62fd3489701ebd78780985c9fdb17cd1c85))


### Bug Fixes

* **eslint:** resolve remaining lint errors and stabilize config ([a6333ee](https://github.com/EpiTrello-Organisation/EpiTrello/commit/a6333ee5692ea317a64bf8924300dd222e87e701))
* **format:** run npm format ([ea2eeb4](https://github.com/EpiTrello-Organisation/EpiTrello/commit/ea2eeb4b3a9802b35ea4bcee88584aa41d20ad23))
* **github hooks:** delete husky, no hooks for now ([28263b0](https://github.com/EpiTrello-Organisation/EpiTrello/commit/28263b075bf7cd9431b2befc3264ee4e67e33272))
* **husky:** changes pre-commit rule ([a49803f](https://github.com/EpiTrello-Organisation/EpiTrello/commit/a49803f0aaae9e25b31b45fe3828ab39ed7bc611))
* **jwt:** remove check /api/me at event, will check at each request ([011c9ab](https://github.com/EpiTrello-Organisation/EpiTrello/commit/011c9abf90ba630697b06a7b0ba5dacc42c06c59))
* **theme:** fix import ([d6ab65b](https://github.com/EpiTrello-Organisation/EpiTrello/commit/d6ab65ba12436bc561b7533a571b96a60ad795bf))
* **UI/UX:** register redirects now to login and avatar icon now illuminates correctly ([8504f42](https://github.com/EpiTrello-Organisation/EpiTrello/commit/8504f4276eb4a16fdf55aa4fdb321e68aff8d96f))
* **UI:** modify 'visited' css to be focused instead of global ([ae5d49c](https://github.com/EpiTrello-Organisation/EpiTrello/commit/ae5d49c63a121426fdfb3152780874a4d3a16e58))
* **useCard:** satisfy exhaustive-deps ([53492b3](https://github.com/EpiTrello-Organisation/EpiTrello/commit/53492b329c53a1a13b1e39f721fa2d3a5abdfe74))
* **workflow:** change branch name ([cf2ce3f](https://github.com/EpiTrello-Organisation/EpiTrello/commit/cf2ce3f33adefaf473efa96ba1282f151b469a41))
* **workflow:** change branch name ([e1bc57a](https://github.com/EpiTrello-Organisation/EpiTrello/commit/e1bc57afc827c864a97e6f46fc7a7859c1cf7e3a))
* **workflow:** change branch name ([81ee24b](https://github.com/EpiTrello-Organisation/EpiTrello/commit/81ee24b7a8e0c34283565d2634bca38a3b242714))


### Refactors

* **board:** split board page into smaller components and css modules ([ecbcd2d](https://github.com/EpiTrello-Organisation/EpiTrello/commit/ecbcd2def849931cf0f417a9534a7a5a0ec83a55))
* **comments:** remove unecessary comments ([40e6e23](https://github.com/EpiTrello-Organisation/EpiTrello/commit/40e6e23e104d57ff38f2629f21249cdce20cb8f2))
* **hooks:** split card-list-board hooks into their own files ([8463a1b](https://github.com/EpiTrello-Organisation/EpiTrello/commit/8463a1bf34e589aa52dd251637f5668474b58536))
* **hooks:** split card-list-board hooks into their own files ([43c72fc](https://github.com/EpiTrello-Organisation/EpiTrello/commit/43c72fcaf0fc21ff52d772534139e26ad35aa2c3))
* **signup/verify:** remove all unecessary code for mvo ([c2fd4b5](https://github.com/EpiTrello-Organisation/EpiTrello/commit/c2fd4b511b1907ca4c39bea71e9bdce5a230349b))


### Documentation

* add README and changelog ([7c781fd](https://github.com/EpiTrello-Organisation/EpiTrello/commit/7c781fd46dcded9dd4a4e0bbaf5291ba4a6f842e))


### Continuous Integration

* **release-please:** add release-please ([4797949](https://github.com/EpiTrello-Organisation/EpiTrello/commit/4797949c9ebb83deec83cefdfd3fafb2bfc0bdee))


### Chores

* **auth:** implement JWT verification and redirect on unauthorized boards access ([8ef1105](https://github.com/EpiTrello-Organisation/EpiTrello/commit/8ef1105ee4ae40fbfb4af27453f8c7f6522f7c32))
* **commebts:** remove unecessary comments ([e89be2e](https://github.com/EpiTrello-Organisation/EpiTrello/commit/e89be2e9849b02c307847ea50479b6258211b8b4))
* **deps:** add @heroicons/react ([201acd5](https://github.com/EpiTrello-Organisation/EpiTrello/commit/201acd5f5fb48d280f10951042e7593419a5bcef))
* **eslint:** add eslint-plugin-import ([2e31d5f](https://github.com/EpiTrello-Organisation/EpiTrello/commit/2e31d5f7efaed7c33e8f3dfd46fe23c0704b6219))
* **eslint:** add eslint-plugin-jsonc ([9401d93](https://github.com/EpiTrello-Organisation/EpiTrello/commit/9401d932199b17296c5e77154e047dc9bd78a5f2))
* **eslint:** add eslint-plugin-unused-import ([8f4583c](https://github.com/EpiTrello-Organisation/EpiTrello/commit/8f4583cedc5362541729b5e41fca214ccfa17aa9))
* **eslint:** add eslint-plugin-yml ([08762ff](https://github.com/EpiTrello-Organisation/EpiTrello/commit/08762ff74fffd14fd322084fe9b73c508ef242b9))
* **eslint:** fix flat-config plugins + json/yaml configs ([291c5a4](https://github.com/EpiTrello-Organisation/EpiTrello/commit/291c5a4c82b08002e3b874c982699ec682f943be))
* **frontend:** setup complete linting, formatting and pre-commit workflow ([5505caf](https://github.com/EpiTrello-Organisation/EpiTrello/commit/5505caf8089bddb7e43352347721be2d9caecb6d))
* **front:** reorganize frontend structure and pages ([20cd85f](https://github.com/EpiTrello-Organisation/EpiTrello/commit/20cd85f2a4799def125bea24df9dda8a1b5f0301))
* **link-back-front:** setup signup and login requests and implemebt CORS in backend ([1b78aab](https://github.com/EpiTrello-Organisation/EpiTrello/commit/1b78aab6c59a85822dfbd46358ad91e3c230fb2d))
* **refactor:** BoardPage.tsx organisation ([d1585e5](https://github.com/EpiTrello-Organisation/EpiTrello/commit/d1585e5703a28b82e5cf3d7c44958d2e2bf4af24))
* **refactor:** split BoardList.tsx into hooks ([275cc8c](https://github.com/EpiTrello-Organisation/EpiTrello/commit/275cc8c6b21cc27c841d6a353ae7406fe8c9d2ba))
* **refactor:** split BoardPage.tsx into hooks and components ([44832bf](https://github.com/EpiTrello-Organisation/EpiTrello/commit/44832bf852201fe3d3a17f902c788371fb4e125a))
* **refactor:** split BoardsPage.tsx into hooks ([4d61e1f](https://github.com/EpiTrello-Organisation/EpiTrello/commit/4d61e1f52e63edc4aa864eb50dfa40eb12797d76))
