const prefix = "../LearnMigration/"
// const prefix = "../"
const country_codes_and_names_path = prefix + "data/country_codes_and_names.json"
const migflow_gender_path = prefix + "data/migflows_gender_separated_1990_2015_filtered_without0flows.csv"
const pop_path = prefix + "data/pop.csv"
const world_json_path = prefix + "data/world.json"
const gender_age_stock_path = prefix + "data/International_and_totalStock_GenderAge.csv"
const dev_level_path = prefix + "data/countries_development_info.csv"

const outflow_color_scheme = ["#f7fbff","#f6faff","#f5fafe","#f5f9fe","#f4f9fe","#f3f8fe","#f2f8fd","#f2f7fd","#f1f7fd","#f0f6fd","#eff6fc","#eef5fc","#eef5fc","#edf4fc","#ecf4fb","#ebf3fb","#eaf3fb","#eaf2fb","#e9f2fa","#e8f1fa","#e7f1fa","#e7f0fa","#e6f0f9","#e5eff9","#e4eff9","#e3eef9","#e3eef8","#e2edf8","#e1edf8","#e0ecf8","#e0ecf7","#dfebf7","#deebf7","#ddeaf7","#ddeaf6","#dce9f6","#dbe9f6","#dae8f6","#d9e8f5","#d9e7f5","#d8e7f5","#d7e6f5","#d6e6f4","#d6e5f4","#d5e5f4","#d4e4f4","#d3e4f3","#d2e3f3","#d2e3f3","#d1e2f3","#d0e2f2","#cfe1f2","#cee1f2","#cde0f1","#cce0f1","#ccdff1","#cbdff1","#cadef0","#c9def0","#c8ddf0","#c7ddef","#c6dcef","#c5dcef","#c4dbee","#c3dbee","#c2daee","#c1daed","#c0d9ed","#bfd9ec","#bed8ec","#bdd8ec","#bcd7eb","#bbd7eb","#b9d6eb","#b8d5ea","#b7d5ea","#b6d4e9","#b5d4e9","#b4d3e9","#b2d3e8","#b1d2e8","#b0d1e7","#afd1e7","#add0e7","#acd0e6","#abcfe6","#a9cfe5","#a8cee5","#a7cde5","#a5cde4","#a4cce4","#a3cbe3","#a1cbe3","#a0cae3","#9ec9e2","#9dc9e2","#9cc8e1","#9ac7e1","#99c6e1","#97c6e0","#96c5e0","#94c4df","#93c3df","#91c3df","#90c2de","#8ec1de","#8dc0de","#8bc0dd","#8abfdd","#88bedc","#87bddc","#85bcdc","#84bbdb","#82bbdb","#81badb","#7fb9da","#7eb8da","#7cb7d9","#7bb6d9","#79b5d9","#78b5d8","#76b4d8","#75b3d7","#73b2d7","#72b1d7","#70b0d6","#6fafd6","#6daed5","#6caed5","#6badd5","#69acd4","#68abd4","#66aad3","#65a9d3","#63a8d2","#62a7d2","#61a7d1","#5fa6d1","#5ea5d0","#5da4d0","#5ba3d0","#5aa2cf","#59a1cf","#57a0ce","#569fce","#559ecd","#549ecd","#529dcc","#519ccc","#509bcb","#4f9acb","#4d99ca","#4c98ca","#4b97c9","#4a96c9","#4895c8","#4794c8","#4693c7","#4592c7","#4492c6","#4391c6","#4190c5","#408fc4","#3f8ec4","#3e8dc3","#3d8cc3","#3c8bc2","#3b8ac2","#3a89c1","#3988c1","#3787c0","#3686c0","#3585bf","#3484bf","#3383be","#3282bd","#3181bd","#3080bc","#2f7fbc","#2e7ebb","#2d7dbb","#2c7cba","#2b7bb9","#2a7ab9","#2979b8","#2878b8","#2777b7","#2676b6","#2574b6","#2473b5","#2372b4","#2371b4","#2270b3","#216fb3","#206eb2","#1f6db1","#1e6cb0","#1d6bb0","#1c6aaf","#1c69ae","#1b68ae","#1a67ad","#1966ac","#1865ab","#1864aa","#1763aa","#1662a9","#1561a8","#1560a7","#145fa6","#135ea5","#135da4","#125ca4","#115ba3","#115aa2","#1059a1","#1058a0","#0f579f","#0e569e","#0e559d","#0e549c","#0d539a","#0d5299","#0c5198","#0c5097","#0b4f96","#0b4e95","#0b4d93","#0b4c92","#0a4b91","#0a4a90","#0a498e","#0a488d","#09478c","#09468a","#094589","#094487","#094386","#094285","#094183","#084082","#083e80","#083d7f","#083c7d","#083b7c","#083a7a","#083979","#083877","#083776","#083674","#083573","#083471","#083370","#08326e","#08316d","#08306b"]

const inflow_color_scheme = ["#fff5eb","#fff5ea","#fff4e9","#fff4e8","#fff3e7","#fff3e6","#fff2e6","#fff2e5","#fff1e4","#fff1e3","#fff0e2","#fff0e1","#ffefe0","#ffefdf","#ffeede","#ffeedd","#feeddc","#feeddb","#feecda","#feecd9","#feebd8","#feebd7","#feead6","#feead5","#fee9d4","#fee9d3","#fee8d2","#fee8d1","#fee7d0","#fee6cf","#fee6ce","#fee5cc","#fee5cb","#fee4ca","#fee4c9","#fee3c8","#fee2c7","#fee2c5","#fee1c4","#fee1c3","#fee0c2","#fedfc0","#fedfbf","#fedebe","#feddbd","#feddbb","#fedcba","#fedbb9","#fedab7","#fddab6","#fdd9b4","#fdd8b3","#fdd8b2","#fdd7b0","#fdd6af","#fdd5ad","#fdd4ac","#fdd4aa","#fdd3a9","#fdd2a7","#fdd1a6","#fdd0a4","#fdd0a3","#fdcfa1","#fdcea0","#fdcd9e","#fdcc9d","#fdcb9b","#fdca99","#fdc998","#fdc896","#fdc795","#fdc693","#fdc591","#fdc490","#fdc38e","#fdc28d","#fdc18b","#fdc089","#fdbf88","#fdbe86","#fdbd84","#fdbc83","#fdbb81","#fdba7f","#fdb97e","#fdb87c","#fdb77a","#fdb679","#fdb577","#fdb475","#fdb374","#fdb272","#fdb171","#fdb06f","#fdaf6d","#fdae6c","#fdad6a","#fdac69","#fdab67","#fdaa65","#fda964","#fda762","#fda661","#fda55f","#fda45e","#fda35c","#fda25b","#fda159","#fda058","#fd9f56","#fd9e55","#fd9d53","#fd9c52","#fd9b50","#fd9a4f","#fc994d","#fc984c","#fc974a","#fc9649","#fc9548","#fc9346","#fc9245","#fc9143","#fc9042","#fb8f40","#fb8e3f","#fb8d3e","#fb8c3c","#fb8b3b","#fa8a3a","#fa8938","#fa8837","#fa8736","#fa8534","#f98433","#f98332","#f98230","#f8812f","#f8802e","#f87f2c","#f77e2b","#f77d2a","#f77b29","#f67a27","#f67926","#f57825","#f57724","#f57623","#f47522","#f47420","#f3731f","#f3721e","#f2701d","#f26f1c","#f16e1b","#f16d1a","#f06c19","#f06b18","#ef6a17","#ef6916","#ee6815","#ed6714","#ed6614","#ec6513","#ec6312","#eb6211","#ea6110","#ea6010","#e95f0f","#e85e0e","#e85d0e","#e75c0d","#e65b0c","#e55a0c","#e4590b","#e4580b","#e3570a","#e25609","#e15509","#e05408","#df5308","#de5208","#dd5207","#dc5107","#db5006","#da4f06","#d94e06","#d84d05","#d74c05","#d64c05","#d54b04","#d44a04","#d24904","#d14804","#d04804","#cf4703","#cd4603","#cc4503","#cb4503","#c94403","#c84303","#c74303","#c54203","#c44103","#c24102","#c14002","#bf3f02","#be3f02","#bd3e02","#bb3e02","#ba3d02","#b83d02","#b73c02","#b53b02","#b43b02","#b23a03","#b13a03","#af3903","#ae3903","#ac3803","#ab3803","#aa3703","#a83703","#a73603","#a53603","#a43503","#a33503","#a13403","#a03403","#9f3303","#9d3303","#9c3203","#9b3203","#993103","#983103","#973003","#953003","#942f03","#932f03","#922e04","#902e04","#8f2d04","#8e2d04","#8d2c04","#8b2c04","#8a2b04","#892b04","#882a04","#862a04","#852904","#842904","#832804","#812804","#802704","#7f2704"]

const income_levels_color_scheme = ["#fcfbfd","#fcfbfd","#fbfafc","#fbfafc","#faf9fc","#faf9fc","#faf8fb","#f9f8fb","#f9f7fb","#f8f7fb","#f8f7fa","#f7f6fa","#f7f6fa","#f7f5fa","#f6f5f9","#f6f4f9","#f5f4f9","#f5f3f9","#f4f3f8","#f4f2f8","#f4f2f8","#f3f2f8","#f3f1f7","#f2f1f7","#f2f0f7","#f1f0f7","#f1eff6","#f0eff6","#f0eef6","#efeef5","#efedf5","#eeedf5","#eeecf5","#edecf4","#edebf4","#ecebf4","#ebeaf3","#ebe9f3","#eae9f3","#eae8f3","#e9e8f2","#e8e7f2","#e8e7f2","#e7e6f1","#e7e5f1","#e6e5f1","#e5e4f0","#e5e4f0","#e4e3f0","#e3e2ef","#e3e2ef","#e2e1ef","#e1e1ee","#e1e0ee","#e0dfee","#dfdfed","#dedeed","#dedded","#ddddec","#dcdcec","#dbdbec","#dbdaeb","#dadaeb","#d9d9ea","#d8d8ea","#d7d7ea","#d7d7e9","#d6d6e9","#d5d5e8","#d4d4e8","#d3d3e8","#d2d3e7","#d2d2e7","#d1d1e6","#d0d0e6","#cfcfe5","#cecee5","#cdcee5","#cccde4","#cbcce4","#cbcbe3","#cacae3","#c9c9e2","#c8c8e2","#c7c7e1","#c6c6e1","#c5c5e0","#c4c4e0","#c3c3df","#c2c3df","#c1c2de","#c0c1de","#bfc0dd","#bebfdd","#bebedc","#bdbddc","#bcbcdb","#bbbbda","#babada","#b9b9d9","#b8b8d9","#b7b7d8","#b6b5d8","#b5b4d7","#b4b3d6","#b3b2d6","#b2b1d5","#b1b0d5","#b0afd4","#afaed4","#aeadd3","#aeacd2","#adabd2","#acaad1","#aba9d1","#aaa8d0","#a9a7cf","#a8a6cf","#a7a5ce","#a6a4ce","#a5a3cd","#a4a2cd","#a3a1cc","#a2a0cb","#a19fcb","#a09eca","#9f9dca","#9e9cc9","#9e9ac9","#9d9ac8","#9c99c8","#9b98c7","#9a97c7","#9996c6","#9895c6","#9794c5","#9693c5","#9592c4","#9491c4","#9390c3","#928fc3","#918ec2","#908dc2","#908cc1","#8f8bc1","#8e8ac0","#8d89c0","#8c88bf","#8b87bf","#8a86be","#8985be","#8884bd","#8883bd","#8782bc","#8680bc","#857fbb","#847eba","#837dba","#827cb9","#827bb9","#817ab8","#8079b8","#7f77b7","#7e76b6","#7e75b6","#7d74b5","#7c73b4","#7b71b4","#7b70b3","#7a6fb3","#796eb2","#786cb1","#786bb1","#776ab0","#7668af","#7567af","#7566ae","#7465ad","#7363ad","#7362ac","#7261ab","#715fab","#705eaa","#705ca9","#6f5ba8","#6e5aa8","#6e58a7","#6d57a6","#6c56a6","#6c54a5","#6b53a4","#6a52a4","#6950a3","#694fa2","#684ea2","#674ca1","#674ba0","#664aa0","#65489f","#65479e","#64469e","#63449d","#63439c","#62429c","#61409b","#613f9a","#603e9a","#5f3c99","#5e3b99","#5e3a98","#5d3897","#5c3797","#5c3696","#5b3595","#5a3395","#5a3294","#593194","#582f93","#582e92","#572d92","#562b91","#562a91","#552990","#54288f","#54268f","#53258e","#52248e","#52238d","#51218c","#50208c","#501f8b","#4f1e8b","#4e1c8a","#4e1b8a","#4d1a89","#4c1988","#4c1788","#4b1687","#4a1587","#4a1486","#491286","#481185","#481084","#470f84","#460d83","#460c83","#450b82","#440a82","#440981","#430780","#420680","#42057f","#41047f","#40027e","#40017e","#3f007d"]

const development_levels_color_scheme = ['yellow', 'green'];

const map_types = ["Migration Flows", "Development Levels", "Income Levels"];
