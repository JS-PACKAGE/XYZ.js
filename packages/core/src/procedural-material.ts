import { Texture } from '../../assets/src/index.js';
import {
  proceduralMaterialLimits,
  proceduralTileMeters,
} from '../../../src/data/materials.js';
import {
  NativeWorkerPool,
  WorkerJobError,
  type NativeWorkerPoolOptions,
  type WorkerJobDefinition,
} from '../../assets/src/worker-jobs.js';
import { PBRMaterial, type PBRMaterialOptions } from './pbr-material.js';
import {
  generateProceduralMaps,
  type ProceduralMaps,
} from './procedural-material-maps.js';

export type ProceduralMaterialKind =
  | 'wood'
  | 'brick'
  | 'stone'
  | 'metal'
  | 'fabric'
  | 'marble'
  | 'concrete'
  | 'tiles'
  | 'leather'
  | 'sand'
  | 'rust'
  | 'snow'
  | 'asphalt'
  | 'gravel'
  | 'cobblestone'
  | 'bark'
  | 'moss'
  | 'mud'
  | 'granite'
  | 'slate'
  | 'terrazzo'
  | 'denim'
  | 'burlap'
  | 'carpet'
  | 'plaster'
  | 'terracotta'
  | 'cork'
  | 'rubber'
  | 'carbonfiber'
  | 'diamondplate'
  | 'paper'
  | 'corrugatedcardboard'
  | 'creasedpaper'
  | 'layeredpaper'
  | 'wicker'
  | 'bamboo'
  | 'hammeredmetal'
  | 'galvanized'
  | 'corrugatedmetal'
  | 'perforatedmetal'
  | 'expandedmetal'
  | 'wiremesh'
  | 'velvet'
  | 'terrycloth'
  | 'boucle'
  | 'geode'
  | 'quartz'
  | 'pyrite'
  | 'shiplap'
  | 'glassblock'
  | 'thatch'
  | 'charredwood'
  | 'driftwood'
  | 'peelingpaint'
  | 'tiretread'
  | 'honeycomb'
  | 'frost'
  | 'stainedglass'
  | 'soapstone'
  | 'butcherblock'
  | 'wallpaper'
  | 'embroidery'
  | 'macrame'
  | 'brickpaving'
  | 'steppingstone'
  | 'woodendeck'
  | 'cheese'
  | 'sugarfrosting'
  | 'candleswax'
  | 'vinylrecord'
  | 'graphpaper'
  | 'notebookpaper'
  | 'lace'
  | 'crochet'
  | 'basketweave'
  | 'zipper'
  | 'velcro'
  | 'button'
  | 'traintracks'
  | 'manholecover'
  | 'speedbump'
  | 'circuitboard'
  | 'solarpanel'
  | 'heattile'
  | 'pianokeys'
  | 'drumskin'
  | 'gongsurface'
  | 'lensarray'
  | 'prismtape'
  | 'fresnel'
  | 'bandage'
  | 'pillblister'
  | 'sutures'
  | 'trellis'
  | 'terracottapot'
  | 'hedgerow'
  | 'collar'
  | 'petbed'
  | 'scratchpost'
  | 'runningtrack'
  | 'bouldermat'
  | 'pooltile'
  | 'envelope'
  | 'chalkboard'
  | 'corkboard'
  | 'snowdrift'
  | 'icicle'
  | 'dewdrops'
  | 'mooncrater'
  | 'starfield'
  | 'nebula'
  | 'pleats'
  | 'shoelace'
  | 'tassel'
  | 'woksurface'
  | 'cutlery'
  | 'choppingboard'
  | 'faucet'
  | 'showerhead'
  | 'bathmat'
  | 'blinds'
  | 'curtain'
  | 'shadecloth'
  | 'sandstone'
  | 'travertine'
  | 'pumice'
  | 'parquet'
  | 'mosaic'
  | 'hexagontiles'
  | 'knit'
  | 'corduroy'
  | 'felt'
  | 'roofshingles'
  | 'rooftiles'
  | 'stucco'
  | 'lichen'
  | 'leaflitter'
  | 'lotusleaf'
  | 'bananaleaf'
  | 'fernleaf'
  | 'endgrain'
  | 'acousticfoam'
  | 'closedcellfoam'
  | 'linoleum'
  | 'suede'
  | 'snakeskin'
  | 'crocodile'
  | 'herringbone'
  | 'tweed'
  | 'seersucker'
  | 'knurledmetal'
  | 'engineturned'
  | 'goldleaf'
  | 'orangepeel'
  | 'coconut'
  | 'watermelon'
  | 'limestone'
  | 'breccia'
  | 'gneiss'
  | 'plywood'
  | 'osb'
  | 'chipboard'
  | 'wafflecloth'
  | 'cableknit'
  | 'quilting'
  | 'crackleglaze'
  | 'flutedceramic'
  | 'encaustictiles'
  | 'fishscales'
  | 'tortoiseshell'
  | 'feathers'
  | 'reedmat'
  | 'rope'
  | 'straw'
  | 'studdedrubber'
  | 'groovedrubber'
  | 'recycledrubber'
  | 'breadcrust'
  | 'wafer'
  | 'chocolate'
  | 'pretzel'
  | 'bagel'
  | 'croissant'
  | 'butterflywing'
  | 'beetlewing'
  | 'spiderweb'
  | 'cirrus'
  | 'cumulus'
  | 'lightning'
  | 'kelp'
  | 'seaweed'
  | 'anemone'
  | 'candy'
  | 'marshmallow'
  | 'nougat'
  | 'frostedglass'
  | 'rippledglass'
  | 'bubbleglass'
  | 'saddlestitch'
  | 'tooledleather'
  | 'patentleather'
  | 'appleskin'
  | 'peachskin'
  | 'grapeskin'
  | 'broccoli'
  | 'cabbage'
  | 'onion'
  | 'bedsheet'
  | 'pillow'
  | 'mattress'
  | 'tealeaf'
  | 'matcha'
  | 'teabag'
  | 'sanddune'
  | 'pebblebeach'
  | 'foamedge'
  | 'lavaflow'
  | 'cooledlava'
  | 'ashfield'
  | 'stalactite'
  | 'flowstone'
  | 'cavefloor'
  | 'jam'
  | 'peanutbutter'
  | 'sprinkles'
  | 'icecream'
  | 'popsicle'
  | 'sorbet'
  | 'spaghetti'
  | 'macaroni'
  | 'lasagna'
  | 'origami'
  | 'paperlace'
  | 'papercut'
  | 'sunflower'
  | 'daisy'
  | 'clover'
  | 'puzzletile'
  | 'legobrick'
  | 'rubberband'
  | 'haybale'
  | 'corncrib'
  | 'fencepost'
  | 'poolfelt'
  | 'icesurface'
  | 'climbingwall'
  | 'oledpanel'
  | 'crtscanline'
  | 'keyboardkey'
  | 'filmstrip'
  | 'postagestamp'
  | 'halftoneprint'
  | 'radiator'
  | 'screwhead'
  | 'chainlink'
  | 'friedegg'
  | 'sushirice'
  | 'chocolatechip'
  | 'cargomat'
  | 'dashboardgrain'
  | 'licenseplate'
  | 'flowerbed'
  | 'grassstripe'
  | 'topiary'
  | 'confetti'
  | 'ribbonstreamer'
  | 'pinatafringe'
  | 'xylophone'
  | 'tambourine'
  | 'castanet'
  | 'pillcapsule'
  | 'pilltablet'
  | 'bathbomb'
  | 'basketball'
  | 'tennisball'
  | 'golfball'
  | 'boardformedconcrete'
  | 'ribbedconcrete'
  | 'splitfaceblock'
  | 'chainmail'
  | 'rivetedmetal'
  | 'weldedmetal'
  | 'cactus'
  | 'pinecone'
  | 'corncob'
  | 'basalt'
  | 'scoria'
  | 'obsidian'
  | 'malachite'
  | 'agate'
  | 'lapislazuli'
  | 'rice'
  | 'sesame'
  | 'coffeebeans'
  | 'braincoral'
  | 'starcoral'
  | 'seasponge'
  | 'houndstooth'
  | 'tartan'
  | 'damask'
  | 'zebrafur'
  | 'leopardfur'
  | 'giraffefur'
  | 'scallopshell'
  | 'oystershell'
  | 'nautilusshell'
  | 'walnutshell'
  | 'peanutshell'
  | 'almondshell'
  | 'cantaloupe'
  | 'dragonfruit'
  | 'kiwiskin'
  | 'rosepetal'
  | 'lilypetal'
  | 'fritillarypetal'
  | 'birchbark'
  | 'palmtrunk'
  | 'sycamorebark'
  | 'elephanthide'
  | 'ostrichleather'
  | 'sharkskin'
  | 'tactilepaving'
  | 'roadmarking'
  | 'draincover'
  | 'mushroomgills'
  | 'morel'
  | 'bracketfungus'
  | 'pineapple'
  | 'strawberry'
  | 'lychee'
  | 'sandpaper'
  | 'steelwool'
  | 'wirebrush'
  | 'cheesegrater'
  | 'ovenrack'
  | 'muffintin'
  | 'gauze'
  | 'elasticbandage'
  | 'icepack'
  | 'bubblewrap'
  | 'sequin'
  | 'pennyround'
  | 'volleyball'
  | 'bowlingball'
  | 'rugbyball'
  | 'wafflecone'
  | 'donutglaze'
  | 'brownie'
  | 'soapbar'
  | 'loofah'
  | 'scrubbypad'
  | 'orangeflesh'
  | 'kiwiflesh'
  | 'avocadoflesh'
  | 'turquoise'
  | 'rhodonite'
  | 'tigereye'
  | 'tatami'
  | 'flutedwood'
  | 'subwaytiles'
  | 'canewebbing'
  | 'rammedearth'
  | 'copperpatina'
  | 'birdseyemaple'
  | 'breezeblock'
  | 'basketweavepavers'
  | 'ripstop'
  | 'octagondot'
  | 'truchettiles'
  | 'standingseam'
  | 'damascus'
  | 'windmillpavers'
  | 'castiron'
  | 'porphyry'
  | 'linen'
  | 'chippedenamel'
  | 'perforatedleather'
  | 'pigskinleather'
  | 'argyle'
  | 'chevronparquet'
  | 'ginkgoleaf'
  | 'pressedtin'
  | 'sashiko'
  | 'ashlar'
  | 'gabion'
  | 'gingham'
  | 'mossypavers'
  | 'bamboocrosscut'
  | 'moire'
  | 'oakleaf'
  | 'rhombille'
  | 'fossillimestone'
  | 'seigaihatiles'
  | 'tuftedleather'
  | 'louveredmetal'
  | 'herringbonebrick'
  | 'shibori'
  | 'scallopedslate'
  | 'saltpan'
  | 'dogbonepavers'
  | 'palmendgrain'
  | 'blackpalm'
  | 'asanoha'
  | 'lotusseedpod'
  | 'crowncaps'
  | 'cofferedconcrete'
  | 'woodworm'
  | 'calcadawaves'
  | 'ikat'
  | 'slottedwood'
  | 'hollyleaf'
  | 'englishbond'
  | 'rebar'
  | 'starfruit'
  | 'diamondrustication'
  | 'bargello'
  | 'saffiano'
  | 'cocoamat'
  | 'suminagashi'
  | 'vermiculite'
  | 'cairotiles'
  | 'guilloche'
  | 'seaurchintest'
  | 'crystallineglaze'
  | 'shirring'
  | 'sunburstveneer'
  | 'rakedgravel'
  | 'flintwall'
  | 'frenchknots'
  | 'artichoke'
  | 'splitlockwashers'
  | 'flemishbond'
  | 'satinweave'
  | 'lotusroot'
  | 'cardboardedge'
  | 'hexnuts'
  | 'capnuts'
  | 'flangenuts'
  | 'calcite'
  | 'halite'
  | 'waffleweave'
  | 'fishscaleshingles'
  | 'starfish'
  | 'snubsquaretiles'
  | 'rhombitrihexagonaltiles'
  | 'elongatedtriangulartiles'
  | 'truncatedtrihexagonaltiles'
  | 'kisrhombilletiles'
  | 'chladnifigure'
  | 'sierpinskicarpet'
  | 'moorecurve'
  | 'papertape'
  | 'ulamspiral'
  | 'sevensegment'
  | 'perfectmaze'
  | 'rule30'
  | 'embossedbraille'
  | 'ean13label'
  | 'soroban'
  | 'deltoidaltrihexagonaltiles'
  | 'snubtrihexagonaltiles'
  | 'floretpentagonaltiles'
  | 'prismaticpentagonaltiles'
  | 'apollonianmosaic'
  | 'ichinghexagrams'
  | 'pythagorastree'
  | 'pentominotiles'
  | 'langtonsant'
  | 'vogelspiral'
  | 'gosperinlay'
  | 'pallasite'
  | 'cuttlebone'
  | 'watermelontourmaline'
  | 'leafstomata'
  | 'chitonshells'
  | 'radiolariandiscs'
  | 'diatomvalves'
  | 'orbicularjasper'
  | 'acornbarnacles'
  | 'circularpavers'
  | 'snowflaketiles'
  | 'sawblades'
  | 'pistachios'
  | 'polkadotfabric'
  | 'cucumberslices'
  | 'monsteraleaf'
  | 'crossstitch'
  | 'staranise'
  | 'logcabinparquet'
  | 'countersunkmetal'
  | 'trilobitefossil'
  | 'eyeletcotton'
  | 'dendriticagate'
  | 'ravioli'
  | 'rollerchain'
  | 'mapleleaf'
  | 'smocking'
  | 'quatrefoiltile'
  | 'okraslice'
  | 'eggcarton'
  | 'greekkey'
  | 'seedbeads'
  | 'chainstitch'
  | 'wingnuts'
  | 'pomegranateslice'
  | 'pawprinttiles'
  | 'dovetailjoint'
  | 'starsocketbolts'
  | 'sanddollar'
  | 'brogueleather'
  | 'clovebuds'
  | 'starcrosstiles'
  | 'maplesamara'
  | 'lenoweave'
  | 'circlips'
  | 'eclips'
  | 'tuliptiles'
  | 'gingerslice'
  | 'fivebarplate'
  | 'cinnamonswirl'
  | 'wheatears'
  | 'scalemail'
  | 'trihexagonaltiles'
  | 'burlwood'
  | 'slottedmetal'
  | 'peppercorns'
  | 'castellatednuts'
  | 'farfalle'
  | 'cardamompods'
  | 'brickarches'
  | 'knottednet'
  | 'fiddleheads'
  | 'cowrieshells'
  | 'cotterpins'
  | 'garterstitch'
  | 'seedstitch'
  | 'mangosteenslice'
  | 'pickettiles'
  | 'squarewashers'
  | 'eucalyptusleaf'
  | 'twillweave'
  | 'pumpkinseeds'
  | 'spurgears'
  | 'diamondcheckertiles'
  | 'appleslice'
  | 'paperclips'
  | 'rclips'
  | 'linchpins'
  | 'woodruffkeys'
  | 'dowelpins'
  | 'clevispins'
  | 'gibheadkeys'
  | 'parallelkeys'
  | 'ivyleaf'
  | 'ribknit'
  | 'pillowtiles'
  | 'coffeerings'
  | 'cashews'
  | 'hinges'
  | 'coins'
  | 'righttriangletiles'
  | 'cherryblossom'
  | 'punchcard'
  | 'braidedcord'
  | 'crossbeddedsandstone'
  | 'grommetcanvas'
  | 'fishscaletiles'
  | 'hexkeys'
  | 'driedfigslice'
  | 'creamcrackers'
  | 'doorkeys'
  | 'dodecagontiles'
  | 'ballchain'
  | 'succulentrosettes'
  | 'foldingfans'
  | 'togglebuttons'
  | 'greenpeapods'
  | 'beltbuckles'
  | 'hextruchettiles'
  | 'scoredmango'
  | 'waxseals'
  | 'cottonbolls'
  | 'carabiners'
  | 'pencilends'
  | 'corrugatedplasticedge'
  | 'haircombs'
  | 'blackberries'
  | 'musselshells'
  | 'safetypins'
  | 'poppyseedpods'
  | 'leatherbookspines'
  | 'matchsticks'
  | 'porcelaininsulators'
  | 'dominoes'
  | 'woodenspoons'
  | 'chessrooks'
  | 'threadspools'
  | 'bellpepperslices'
  | 'sharkteeth'
  | 'grinderburrs'
  | 'cowhide'
  | 'spaltedwood'
  | 'canlids'
  | 'crinoidossicles'
  | 'pythagoreantiles'
  | 'dinnerforks'
  | 'goldbrocade'
  | 'mudtiretracks'
  | 'peacockfeathers'
  | 'tangramtiles'
  | 'batterypositivecaps'
  | 'passionfruitslice'
  | 'screwterminalblocks'
  | 'dragonfruitflesh'
  | 'speakercones'
  | 'septarianstone'
  | 'axialresistors'
  | 'tomatoslices'
  | 'pinstripewool'
  | 'chrysanthemumstone'
  | 'snowflakeobsidian'
  | 'sewingsnaps'
  | 'lathplaster'
  | 'ceramiccapacitors'
  | 'fennelseeds'
  | 'rj45femalefaces'
  | 'rcafemalefaces'
  | 'f05opticalfaces'
  | 'minidin4femalefaces'
  | 'dcbarreljackfaces'
  | 'stfiberadapterfaces'
  | 'to92packagefaces'
  | 'ludoboard'
  | 'chessopening'
  | 'xiangqiboard'
  | 'cribbageboard'
  | 'monopolyboard'
  | 'scrabbleboard'
  | 'duccirows'
  | 'wireworldcircuit'
  | 'cycliccellular'
  | 'beattypartition'
  | 'walshmatrix'
  | 'paperfoldingruler'
  | 'rudinshapirogrid'
  | 'baumsweetgrid'
  | 'binarynecklaces'
  | 'catalantriangulations'
  | 'eisensteinprimes'
  | 'keplerorbit'
  | 'pythagoreanproof'
  | 'contributiongraph'
  | 'arbelos'
  | 'eulerlinetriangle'
  | 'astroidladder'
  | 'slopegraph'
  | 'kolakoskisequence'
  | 'crcdivision'
  | 'lfsrstates'
  | 'fareysequence'
  | 'unionfindmerges'
  | 'linearprobing'
  | 'bloomfilter'
  | 'gamblersruin'
  | 'nimgame'
  | 'wordlefeedback'
  | 'funnelchart'
  | 'lrucachetrace'
  | 'prefixtrie'
  | 'knapsacktable'
  | 'bfswavefront'
  | 'bresenhamlines'
  | 'mergesortruns'
  | 'radixsortpasses'
  | 'paretochart'
  | 'vernierscale'
  | 'kmpfailure'
  | 'dijkstragrid'
  | 'binarysearchsteps'
  | 'quicksortsteps'
  | 'ganttschedule'
  | 'lorenzcurve'
  | 'zordercurve'
  | 'histogrambins'
  | 'sankeyflows'
  | 'bodeplots'
  | 'huffmancodes'
  | 'hashchains'
  | 'editdistance'
  | 'nearesttour'
  | 'karnaughmap'
  | 'bsttreeorder'
  | 'kdtreesplits'
  | 'spanningtree'
  | 'ecdfplot'
  | 'intervalpartition'
  | 'waterfallchart'
  | 'chorddiagrams'
  | 'qamconstellation'
  | 'countertimings'
  | 'hofstadterq'
  | 'semaphorefigures'
  | 'fenwicktree'
  | 'jacobisymbols'
  | 'vicsekfractal'
  | 'segmenttree'
  | 'rankchevrons'
  | 'windbarbs'
  | 'compassrose'
  | 'smithchart'
  | 'mahjongdots'
  | 'qrcodemodules'
  | 'gaugedials'
  | 'flagpatterns'
  | 'intelhexrecords'
  | 'equalizerbars'
  | 'worleycells'
  | 'errordiffusion'
  | 'tetrominoes'
  | 'candlestickcharts'
  | 'paleygraphmatrix'
  | 'superformulacells'
  | 'tsquarefractal'
  | 'marchingsquares'
  | 'wangtiles'
  | 'htreefractal'
  | 'lsystemplant'
  | 'quadtreecells'
  | 'countingrods'
  | 'braiddiagram'
  | 'youngtableaux'
  | 'euclidsquares'
  | 'voronoicells'
  | 'cliffordattractor'
  | 'peanocurve'
  | 'bitwisetable'
  | 'golombrulers'
  | 'henonattractor'
  | 'digitalroottable'
  | 'thuemorsegrid'
  | 'recamanarcs'
  | 'happynumberchains'
  | 'lookandsayrows'
  | 'kaprekarsteps'
  | 'roundrobintable'
  | 'roulettewheel'
  | 'circleoffifths'
  | 'periodictablecells'
  | 'josephuscircle'
  | 'gaussianprimes'
  | 'timestablecircles'
  | 'divisorcountbars'
  | 'cobwebplots'
  | 'sierpinskipascal'
  | 'sacksspiral'
  | 'dyckpaths'
  | 'figuratenumbers'
  | 'pythagoreantriples'
  | 'hexdumprows'
  | 'pairingtables'
  | 'ferrersdiagrams'
  | 'zeckendorfrows'
  | 'cycloidcusps'
  | 'sternbrocottree'
  | 'projectilearcs'
  | 'isbn10checks'
  | 'runlengthrows'
  | 'graphcoloring'
  | 'bubblesortpasses'
  | 'binaryheaptree'
  | 'dicesumbars'
  | 'substitutionwords'
  | 'stemandleaf'
  | 'boxplots'
  | 'sorobanabacus'
  | 'numberwords'
  | 'dipolefieldlines'
  | 'mobiusgrid'
  | 'fordcircles'
  | 'vectorfieldarrows'
  | 'wordsquares'
  | 'caesarcipher'
  | 'baseconversion'
  | 'primefactors'
  | 'modularpowers'
  | 'burningship'
  | 'logisticbifurcation'
  | 'bitwiselogic'
  | 'gcdtable'
  | 'percolationclusters'
  | 'abeliansandpile'
  | 'binaryaddition'
  | 'roundingmodes'
  | 'bellcurvebands'
  | 'ieee754floats'
  | 'vennregions'
  | 'bezierconstruction'
  | 'luhnnumbers'
  | 'twosourceripples'
  | 'cassiniovals'
  | 'rosecurves'
  | 'conicsections'
  | 'cantorsetrows'
  | 'mandelbrotbands'
  | 'newtonbasins'
  | 'kochsnowflake'
  | 'matrixproducts'
  | 'signedencodings'
  | 'romannumerals'
  | 'cayleytables'
  | 'hammingcodewords'
  | 'collatzsequences'
  | 'delaunaytriangles'
  | 'convexhullpoints'
  | 'pascaltrianglenumbers'
  | 'fouriersquarewaves'
  | 'truthtablelogic'
  | 'barchartbars'
  | 'regressionscatter'
  | 'piechartwedges'
  | 'analogclocks'
  | 'treemaprects'
  | 'moonphases'
  | 'multiplicationtable'
  | 'draughtsposition'
  | 'colormapregions'
  | 'chinesecheckersboard'
  | 'euclideanrhythms'
  | 'hidatochain'
  | 'mancalaboard'
  | 'rushhourjam'
  | 'numberlinkpaths'
  | 'kenkencages'
  | 'takuzugrid'
  | 'akarilights'
  | 'hitorishading'
  | 'shikakurects'
  | 'tentsandtrees'
  | 'nurikabeislands'
  | 'futoshikigrid'
  | 'fillominoregions'
  | 'stringartcurves'
  | 'masyupearls'
  | 'slitherlinkloop'
  | 'hashibridges'
  | 'kakuropuzzle'
  | 'hexresourceboard'
  | 'bowlingscoresheet'
  | 'dewbeads'
  | 'goboards'
  | 'othelloboard'
  | 'binaryclock'
  | 'pianoroll'
  | 'skyscraperpuzzles'
  | 'knockoutbracket'
  | 'primesieve'
  | 'sortingnetworks'
  | 'mayansums'
  | 'latinsquares'
  | 'hanoitowers'
  | 'eightqueens'
  | 'cantordust'
  | 'dragoncurve'
  | 'pascalmodulo'
  | 'gameoflife'
  | 'oghaminscription'
  | 'kaleidoscope'
  | 'slidingpuzzle'
  | 'magicsquares'
  | 'wordsearchgrid'
  | 'mastermindboard'
  | 'elementaryautomata'
  | 'bluenoisemask'
  | 'fibonaccisquares'
  | 'doubleslitfringes'
  | 'sundialplate'
  | 'ledgersheet'
  | 'louvershutter'
  | 'chesterfieldtufting'
  | 'polargraphpaper'
  | 'tallymarks'
  | 'quasicrystalwaves'
  | 'tictactoegames'
  | 'dartboardsectors'
  | 'featherbarbs'
  | 'amidakuji'
  | 'code39barcodes'
  | 'graycodediscs'
  | 'knightstour'
  | 'scrambledcubenet'
  | 'weavingdraft'
  | 'lightsoutboard'
  | 'nonogrampuzzle'
  | 'juliacells'
  | 'spirographrosettes'
  | 'sliderulescale'
  | 'xylophonebars'
  | 'pegsolitaire'
  | 'bingocard'
  | 'connectfourboard'
  | 'ramennoodles'
  | 'jigsawpuzzle'
  | 'backgammonboard'
  | 'zoneplates'
  | 'lissajousgrid'
  | 'mondriancomposition'
  | 'hilbertcurve'
  | 'battleshipgrid'
  | 'tetrisstack'
  | 'minesweeperboard'
  | 'flipdotdisplay'
  | 'crosswordgrid'
  | 'fretboard'
  | 'calendarpage'
  | 'measuringtape'
  | 'sudokugrid'
  | 'sheetmusic'
  | 'ecgpaper'
  | 'datamatrixcodes'
  | 'frostpolygons'
  | 'sandripples'
  | 'morsetape'
  | 'ean13barcodes'
  | 'kilimflatweave'
  | 'tumblingblocks'
  | 'azulejotiles'
  | 'moirefringes'
  | 'cinderblockwall'
  | 'dicefaces'
  | 'needlepoint'
  | 'mandalaflower'
  | 'kiwislices'
  | 'hazardstripes'
  | 'radarscope'
  | 'digitalcamo'
  | 'topographiccontours'
  | 'garnetschist'
  | 'celticplait'
  | 'atomicboomerang'
  | 'lawnstripes'
  | 'asphaltshingle'
  | 'expandedpolystyrene'
  | 'octopussuckers'
  | 'ammonitestone'
  | 'amberresin'
  | 'patchworkquilt'
  | 'bayerdither'
  | 'turingpattern'
  | 'mudcloth'
  | 'to220packagefaces'
  | 'ftypefemalefaces'
  | 'usbcfemalefaces'
  | 'iecc6inlets'
  | 'iecc8inlets'
  | 'din5femalefaces'
  | 'xlrfemalefaces'
  | 'bncfemalefaces'
  | 'iecc14inlets'
  | 'dsubsocketfaces'
  | 'topadjusttrimmers'
  | 'crownprobetips'
  | 'piezodiaphragms'
  | 'castellatedboards'
  | 'qfnlandpads'
  | 'bgasolderballs'
  | 'ballbearingfaces'
  | 'baseballleather'
  | 'toothbrushheads'
  | 'bowtieinlay'
  | 'redcabbagecut'
  | 'slottedturners'
  | 'triglidesliders'
  | 'popcorn'
  | 'dualinlinechips'
  | 'tortoiseshellacetate'
  | 'cathedralquilt'
  | 'matelasse'
  | 'silknoil'
  | 'buckwheathulls'
  | 'rutilatedquartz'
  | 'peppermintcanes'
  | 'rubbergrommets'
  | 'chioggiabeetcuts'
  | 'flatflexcables'
  | 'celerycuts'
  | 'tactileswitches'
  | 'paisleybrocade'
  | 'siliconepastrybrushes'
  | 'graphicgranite'
  | 'brasspadlocks'
  | 'carrotcuts'
  | 'bluepushpins'
  | 'oatflakes'
  | 'tigerfur'
  | 'grosgrainribbons'
  | 'azuritemalachite'
  | 'openendspanners'
  | 'lentilseeds'
  | 'blueprintpaper'
  | 'horsechestnutleaf'
  | 'binderclips'
  | 'charoite'
  | 'chenilleyarn'
  | 'ceramicfuses'
  | 'hazelnutshells'
  | 'yagasuricloth'
  | 'balloonwhisks'
  | 'orthocerasstone'
  | 'rickracktrim'
  | 'toroidalinductors'
  | 'pennerigate'
  | 'lepidolitemica'
  | 'brassjinglebells'
  | 'nutmeghalves'
  | 'coaxialcablecuts'
  | 'shippocloth'
  | 'driedtamarindpods'
  | 'conicalsampletubes'
  | 'botryoidalcopper'
  | 'pencilshavings'
  | 'papayacuts'
  | 'sewingthimbles'
  | 'boullebrassinlay'
  | 'diamondpanelparquet'
  | 'dendriticfrost'
  | 'bullionknots'
  | 'orecchiette'
  | 'solderlessbreadboard'
  | 'kyaniteblades'
  | 'wulfenite'
  | 'staurolite'
  | 'azurite'
  | 'celestine'
  | 'barite'
  | 'internaltoothwashers'
  | 'driedchillies'
  | 'utilityknifeblades'
  | 'windmillparquet'
  | 'bismuthhoppers'
  | 'splitvanillapods'
  | 'seamrippers'
  | 'flakedarrowheads'
  | 'dandelionseeds'
  | 'shojipaperlattice'
  | 'nyloncableties'
  | 'weavingshuttles'
  | 'tailorstapes'
  | 'woodenclothespins'
  | 'cinnamonbarkcoils'
  | 'compactcassettefaces'
  | 'kintsugiceramic'
  | 'pleatedfilterpapers'
  | 'splitcedarshakes'
  | 'swavepavers'
  | 'mushroomslices'
  | 'insulatedringlugs'
  | 'bananaslices'
  | 'rosemarysprigs'
  | 'pencilsharpeners'
  | 'scissors'
  | 'serpentinesprings'
  | 'impellerfaces'
  | 'chipresistors'
  | 'memorycardbacks'
  | 'gnocchi'
  | 'rectangularsocketfaces'
  | 'saffronthreads'
  | 'fishhooks'
  | 'violinfholes'
  | 'palmiers'
  | 'barbedwire'
  | 'oxfordweave'
  | 'lacewood'
  | 'papyrus'
  | 'larimar'
  | 'paperbark'
  | 'horseshoes'
  | 'durianpeel'
  | 'flystitch'
  | 'abaloneshells'
  | 'gyroidinfill'
  | 'cloisonne'
  | 'rambutanskin'
  | 'rackgears'
  | 'grosgrain'
  | 'faille'
  | 'bedfordcord'
  | 'poplin'
  | 'ooliticlimestone'
  | 'ogeetiles'
  | 'bittermelonskin'
  | 'cocobolo'
  | 'doubleedgerazorblades'
  | 'chiastolite'
  | 'dimity'
  | 'juniperberries'
  | 'gabbro'
  | 'turnbuckles'
  | 'rhodochrosite'
  | 'bluelaceagate'
  | 'bayleaf'
  | 'whipcord'
  | 'gabardine'
  | 'oilspotglaze'
  | 'persimmonslice'
  | 'kitkattiles'
  | 'brakediscs'
  | 'mulberrypaper'
  | 'howlite'
  | 'sodalite'
  | 'ottoman'
  | 'shackles'
  | 'watercaltrops'
  | 'fluorite'
  | 'vanadinite'
  | 'pyromorphite'
  | 'redberyl'
  | 'cavansite'
  | 'wenge'
  | 'parchment'
  | 'cavalrytwill'
  | 'screwhooks'
  | 'nigellaseeds'
  | 'phyllite'
  | 'shantung'
  | 'hempcrete'
  | 'utilityblades'
  | 'chrysocolla'
  | 'hemimorphite'
  | 'smithsonite'
  | 'sichuanpepperhusks'
  | 'huckaback'
  | 'anorthosite'
  | 'cubebberries'
  | 'seraphinite'
  | 'hexsocketheads'
  | 'datepits'
  | 'sapele'
  | 'chambray'
  | 'ticking'
  | 'cottondrill'
  | 'nephrite'
  | 'diorite'
  | 'carawayseeds'
  | 'springpinends'
  | 'rhyolite'
  | 'tonkabeans'
  | 'pentalobescrewheads'
  | 'padauk'
  | 'cottonflannel'
  | 'pinolith'
  | 'tripointscrewheads'
  | 'septarian'
  | 'squaresocketheads'
  | 'trianglesocketheads'
  | 'pietersite'
  | 'bronzite'
  | 'castorbeans'
  | 'zebrawood'
  | 'bocote'
  | 'europeanbeech'
  | 'whiteoak'
  | 'whiteash'
  | 'kingwood'
  | 'braziliantulipwood'
  | 'macassarebony'
  | 'twopinscrewheads'
  | 'amazonite'
  | 'blackeyedpeas'
  | 'adzukibeans'
  | 'anigre'
  | 'makore'
  | 'larvikite'
  | 'squareholewashers'
  | 'tigerwood'
  | 'snakewood'
  | 'safflowerseeds'
  | 'thulite'
  | 'unakite'
  | 'eudialyte'
  | 'lignumvitae'
  | 'iroko'
  | 'purpleheart'
  | 'yellowheart'
  | 'bloodwood'
  | 'basswood'
  | 'tabwashers'
  | 'sphericalwashers'
  | 'mungbeans'
  | 'thomsonite'
  | 'dalmatianstone'
  | 'nickelsilver'
  | 'hopsack'
  | 'monkscloth'
  | 'lyocell'
  | 'sateen'
  | 'surah'
  | 'serge'
  | 'habotai'
  | 'batiste'
  | 'ramie'
  | 'wavewashers'
  | 'cupwashers';

export interface ProceduralMaterialOptions {
  size?: number;
  seed?: number;
  /** Generate a linear height map; parallax still requires finish.heightScale. */
  heightMap?: boolean;
  /** 1 keeps the authored contrast. Finite and at least 0. */
  contrast?: number;
  /** Added to authored roughness, then clamped. Default 0. */
  roughnessBias?: number;
  /** UV repeats of the generated tile. Default 1. */
  repeats?: number;
  /**
   * Per-channel multipliers for the authored sRGB pigment, each finite and
   * within 0..4. Omitted keeps the authored colors byte-identical.
   */
  tint?: readonly [number, number, number];
  /**
   * Generates the maps on this caller-owned pool instead of the calling thread,
   * using `createProceduralWorkerPool()` or an equivalent trusted module.
   * Output is byte-identical to synchronous generation; the pool is borrowed.
   */
  workerPool?: NativeWorkerPool;
  /**
   * Reuses generated CPU maps for identical kind/size/seed/contrast/
   * roughnessBias/tint/heightMap. Every preset still owns its own textures.
   */
  cache?: ProceduralMapCache;
}

/** Validated generation inputs sent to a trusted procedural worker. */
export interface ProceduralMapsRequest {
  readonly kind: ProceduralMaterialKind;
  readonly size: number;
  readonly seed: number;
  readonly contrast: number;
  readonly roughnessBias: number;
  readonly tint?: readonly [number, number, number];
  readonly heightMap?: boolean;
}

function decodeProceduralMaps(value: unknown): ProceduralMaps {
  if (!value || typeof value !== 'object')
    throw new TypeError('A procedural maps response is required.');
  const maps = value as ProceduralMaps;
  const length = (maps.baseColor as unknown as Uint8ClampedArray | undefined)
    ?.length;
  const side = Math.sqrt((length ?? 0) / 4);
  if (
    !Number.isInteger(side) ||
    side < proceduralMaterialLimits.minSize ||
    side > proceduralMaterialLimits.maxSize ||
    ![
      maps.baseColor,
      maps.normal,
      maps.metallicRoughness,
      maps.occlusion,
    ].every(
      (stream) =>
        stream instanceof Uint8ClampedArray && stream.length === length,
    ) ||
    (maps.height !== undefined &&
      (!(maps.height instanceof Uint8ClampedArray) ||
        maps.height.length !== length))
  )
    throw new RangeError('Worker procedural maps do not match their size.');
  return maps;
}

export const proceduralMapsJob: WorkerJobDefinition<
  ProceduralMapsRequest,
  ProceduralMaps
> = {
  type: 'procedural.maps',
  decode: decodeProceduralMaps,
  release() {
    // Responses own only ArrayBuffers; dropping the reference reclaims them.
  },
};

/** Resolves to a real emitted .js module in the published dist tree. */
export function proceduralWorkerURL(): URL {
  return new URL('./workers/procedural-material.worker.js', import.meta.url);
}

/** Static native Worker construction is visible to bundlers. */
export function createProceduralWorkerPool(
  options: Omit<NativeWorkerPoolOptions, 'moduleURL' | 'workerFactory'> = {},
): NativeWorkerPool {
  if (typeof Worker === 'undefined')
    throw new WorkerJobError(
      'unsupported',
      'Native module Workers are unavailable.',
    );
  return new NativeWorkerPool({
    ...options,
    moduleURL: proceduralWorkerURL(),
    workerFactory: () =>
      new Worker(
        new URL('./workers/procedural-material.worker.js', import.meta.url),
        { type: 'module' },
      ),
  });
}

export interface ProceduralMapCacheOptions {
  /** Retained map bytes, including optional RGBA height maps. Default 64 MiB. */
  maxBytes?: number;
  /** Retained entries. Default 32. */
  maxEntries?: number;
}

/**
 * Caller-owned, bounded least-recently-used cache of generated CPU maps.
 * Concurrent identical requests share one generation; failures are not cached.
 * Cached arrays are never handed out, only copied into new textures.
 */
export class ProceduralMapCache {
  readonly maxBytes: number;
  readonly maxEntries: number;
  private readonly entries = new Map<string, ProceduralMaps>();
  private readonly pending = new Map<string, Promise<ProceduralMaps>>();
  private retained = 0;
  private hitCount = 0;
  private missCount = 0;

  constructor(options: ProceduralMapCacheOptions = {}) {
    const maxBytes =
      options.maxBytes ?? proceduralMaterialLimits.cacheDefaultBytes;
    const maxEntries =
      options.maxEntries ?? proceduralMaterialLimits.cacheDefaultEntries;
    if (
      !Number.isSafeInteger(maxBytes) ||
      maxBytes < 0 ||
      maxBytes > proceduralMaterialLimits.cacheMaxBytes ||
      !Number.isSafeInteger(maxEntries) ||
      maxEntries < 0 ||
      maxEntries > proceduralMaterialLimits.cacheMaxEntries
    )
      throw new RangeError(
        'Procedural cache maxBytes must be an integer 0..1 GiB and maxEntries 0..4096.',
      );
    this.maxBytes = maxBytes;
    this.maxEntries = maxEntries;
  }

  /** Number of retained entries. */
  get size(): number {
    return this.entries.size;
  }

  /** Bytes retained by cached maps. */
  get bytes(): number {
    return this.retained;
  }

  get hits(): number {
    return this.hitCount;
  }

  get misses(): number {
    return this.missCount;
  }

  /** Drops retained maps. Generations already in flight still complete and are then retained. */
  clear(): void {
    this.entries.clear();
    this.retained = 0;
  }

  /** @internal Used by ProceduralMaterial.create with an already validated request. */
  async acquire(
    request: ProceduralMapsRequest,
    generate: () => Promise<ProceduralMaps>,
  ): Promise<ProceduralMaps> {
    const key = [
      request.kind,
      request.size,
      request.seed,
      request.contrast,
      request.roughnessBias,
      request.tint?.join(',') ?? '',
      request.heightMap ? 1 : 0,
    ].join('|');
    const cached = this.entries.get(key);
    if (cached) {
      this.hitCount++;
      // Reinsert to mark as most recently used.
      this.entries.delete(key);
      this.entries.set(key, cached);
      return cached;
    }
    const inFlight = this.pending.get(key);
    if (inFlight) {
      this.hitCount++;
      return inFlight;
    }
    this.missCount++;
    const promise = generate();
    this.pending.set(key, promise);
    try {
      const maps = await promise;
      this.store(key, maps);
      return maps;
    } finally {
      this.pending.delete(key);
    }
  }

  private store(key: string, maps: ProceduralMaps): void {
    const bytes =
      maps.baseColor.byteLength * 4 + (maps.height?.byteLength ?? 0);
    if (bytes > this.maxBytes || this.maxEntries === 0) return;
    this.entries.set(key, maps);
    this.retained += bytes;
    for (const [oldest, old] of this.entries) {
      if (
        this.retained <= this.maxBytes &&
        this.entries.size <= this.maxEntries
      )
        break;
      this.entries.delete(oldest);
      this.retained -=
        old.baseColor.byteLength * 4 + (old.height?.byteLength ?? 0);
    }
  }
}

/** UV repeats so one mesh of `meters` uses the preset's physical tile size. */
export function proceduralRepeats(
  kind: ProceduralMaterialKind,
  meters: number,
): number {
  if (!Number.isFinite(meters) || meters <= 0)
    throw new RangeError(
      'Procedural surface size must be finite and positive.',
    );
  return meters / proceduralTileMeters[kind];
}

interface ProceduralTextures {
  readonly baseColor: Texture;
  readonly normal: Texture;
  readonly metallicRoughness: Texture;
  readonly occlusion: Texture;
  readonly height?: Texture;
}

const kinds: readonly ProceduralMaterialKind[] = [
  'wood',
  'brick',
  'stone',
  'metal',
  'fabric',
  'marble',
  'concrete',
  'tiles',
  'leather',
  'sand',
  'rust',
  'snow',
  'asphalt',
  'gravel',
  'cobblestone',
  'bark',
  'moss',
  'mud',
  'granite',
  'slate',
  'terrazzo',
  'denim',
  'burlap',
  'carpet',
  'plaster',
  'terracotta',
  'cork',
  'rubber',
  'carbonfiber',
  'diamondplate',
  'paper',
  'corrugatedcardboard',
  'creasedpaper',
  'layeredpaper',
  'wicker',
  'bamboo',
  'hammeredmetal',
  'galvanized',
  'corrugatedmetal',
  'perforatedmetal',
  'expandedmetal',
  'wiremesh',
  'velvet',
  'terrycloth',
  'boucle',
  'geode',
  'quartz',
  'pyrite',
  'shiplap',
  'glassblock',
  'thatch',
  'charredwood',
  'driftwood',
  'peelingpaint',
  'tiretread',
  'honeycomb',
  'frost',
  'stainedglass',
  'soapstone',
  'butcherblock',
  'wallpaper',
  'embroidery',
  'macrame',
  'brickpaving',
  'steppingstone',
  'woodendeck',
  'cheese',
  'sugarfrosting',
  'candleswax',
  'vinylrecord',
  'graphpaper',
  'notebookpaper',
  'lace',
  'crochet',
  'basketweave',
  'zipper',
  'velcro',
  'button',
  'traintracks',
  'manholecover',
  'speedbump',
  'circuitboard',
  'solarpanel',
  'heattile',
  'pianokeys',
  'drumskin',
  'gongsurface',
  'lensarray',
  'prismtape',
  'fresnel',
  'bandage',
  'pillblister',
  'sutures',
  'trellis',
  'terracottapot',
  'hedgerow',
  'collar',
  'petbed',
  'scratchpost',
  'runningtrack',
  'bouldermat',
  'pooltile',
  'envelope',
  'chalkboard',
  'corkboard',
  'snowdrift',
  'icicle',
  'dewdrops',
  'mooncrater',
  'starfield',
  'nebula',
  'pleats',
  'shoelace',
  'tassel',
  'woksurface',
  'cutlery',
  'choppingboard',
  'faucet',
  'showerhead',
  'bathmat',
  'blinds',
  'curtain',
  'shadecloth',
  'sandstone',
  'travertine',
  'pumice',
  'parquet',
  'mosaic',
  'hexagontiles',
  'knit',
  'corduroy',
  'felt',
  'roofshingles',
  'rooftiles',
  'stucco',
  'lichen',
  'leaflitter',
  'lotusleaf',
  'bananaleaf',
  'fernleaf',
  'endgrain',
  'acousticfoam',
  'closedcellfoam',
  'linoleum',
  'suede',
  'snakeskin',
  'crocodile',
  'herringbone',
  'tweed',
  'seersucker',
  'knurledmetal',
  'engineturned',
  'goldleaf',
  'orangepeel',
  'coconut',
  'watermelon',
  'limestone',
  'breccia',
  'gneiss',
  'plywood',
  'osb',
  'chipboard',
  'wafflecloth',
  'cableknit',
  'quilting',
  'crackleglaze',
  'flutedceramic',
  'encaustictiles',
  'fishscales',
  'tortoiseshell',
  'feathers',
  'reedmat',
  'rope',
  'straw',
  'studdedrubber',
  'groovedrubber',
  'recycledrubber',
  'breadcrust',
  'wafer',
  'chocolate',
  'pretzel',
  'bagel',
  'croissant',
  'butterflywing',
  'beetlewing',
  'spiderweb',
  'cirrus',
  'cumulus',
  'lightning',
  'kelp',
  'seaweed',
  'anemone',
  'candy',
  'marshmallow',
  'nougat',
  'frostedglass',
  'rippledglass',
  'bubbleglass',
  'saddlestitch',
  'tooledleather',
  'patentleather',
  'appleskin',
  'peachskin',
  'grapeskin',
  'broccoli',
  'cabbage',
  'onion',
  'bedsheet',
  'pillow',
  'mattress',
  'tealeaf',
  'matcha',
  'teabag',
  'sanddune',
  'pebblebeach',
  'foamedge',
  'lavaflow',
  'cooledlava',
  'ashfield',
  'stalactite',
  'flowstone',
  'cavefloor',
  'jam',
  'peanutbutter',
  'sprinkles',
  'icecream',
  'popsicle',
  'sorbet',
  'spaghetti',
  'macaroni',
  'lasagna',
  'origami',
  'paperlace',
  'papercut',
  'sunflower',
  'daisy',
  'clover',
  'puzzletile',
  'legobrick',
  'rubberband',
  'haybale',
  'corncrib',
  'fencepost',
  'poolfelt',
  'icesurface',
  'climbingwall',
  'oledpanel',
  'crtscanline',
  'keyboardkey',
  'filmstrip',
  'postagestamp',
  'halftoneprint',
  'radiator',
  'screwhead',
  'chainlink',
  'friedegg',
  'sushirice',
  'chocolatechip',
  'cargomat',
  'dashboardgrain',
  'licenseplate',
  'flowerbed',
  'grassstripe',
  'topiary',
  'confetti',
  'ribbonstreamer',
  'pinatafringe',
  'xylophone',
  'tambourine',
  'castanet',
  'pillcapsule',
  'pilltablet',
  'bathbomb',
  'basketball',
  'tennisball',
  'golfball',
  'boardformedconcrete',
  'ribbedconcrete',
  'splitfaceblock',
  'chainmail',
  'rivetedmetal',
  'weldedmetal',
  'cactus',
  'pinecone',
  'corncob',
  'basalt',
  'scoria',
  'obsidian',
  'malachite',
  'agate',
  'lapislazuli',
  'rice',
  'sesame',
  'coffeebeans',
  'braincoral',
  'starcoral',
  'seasponge',
  'houndstooth',
  'tartan',
  'damask',
  'zebrafur',
  'leopardfur',
  'giraffefur',
  'scallopshell',
  'oystershell',
  'nautilusshell',
  'walnutshell',
  'peanutshell',
  'almondshell',
  'cantaloupe',
  'dragonfruit',
  'kiwiskin',
  'rosepetal',
  'lilypetal',
  'fritillarypetal',
  'birchbark',
  'palmtrunk',
  'sycamorebark',
  'elephanthide',
  'ostrichleather',
  'sharkskin',
  'tactilepaving',
  'roadmarking',
  'draincover',
  'mushroomgills',
  'morel',
  'bracketfungus',
  'pineapple',
  'strawberry',
  'lychee',
  'sandpaper',
  'steelwool',
  'wirebrush',
  'cheesegrater',
  'ovenrack',
  'muffintin',
  'gauze',
  'elasticbandage',
  'icepack',
  'bubblewrap',
  'sequin',
  'pennyround',
  'volleyball',
  'bowlingball',
  'rugbyball',
  'wafflecone',
  'donutglaze',
  'brownie',
  'soapbar',
  'loofah',
  'scrubbypad',
  'orangeflesh',
  'kiwiflesh',
  'avocadoflesh',
  'turquoise',
  'rhodonite',
  'tigereye',
  'tatami',
  'flutedwood',
  'subwaytiles',
  'canewebbing',
  'rammedearth',
  'copperpatina',
  'birdseyemaple',
  'breezeblock',
  'basketweavepavers',
  'ripstop',
  'octagondot',
  'truchettiles',
  'standingseam',
  'damascus',
  'windmillpavers',
  'castiron',
  'porphyry',
  'linen',
  'chippedenamel',
  'perforatedleather',
  'pigskinleather',
  'argyle',
  'chevronparquet',
  'ginkgoleaf',
  'pressedtin',
  'sashiko',
  'ashlar',
  'gabion',
  'gingham',
  'mossypavers',
  'bamboocrosscut',
  'moire',
  'oakleaf',
  'rhombille',
  'fossillimestone',
  'seigaihatiles',
  'tuftedleather',
  'louveredmetal',
  'herringbonebrick',
  'shibori',
  'scallopedslate',
  'saltpan',
  'dogbonepavers',
  'palmendgrain',
  'blackpalm',
  'asanoha',
  'lotusseedpod',
  'crowncaps',
  'cofferedconcrete',
  'woodworm',
  'calcadawaves',
  'ikat',
  'slottedwood',
  'hollyleaf',
  'englishbond',
  'rebar',
  'starfruit',
  'diamondrustication',
  'bargello',
  'saffiano',
  'cocoamat',
  'suminagashi',
  'vermiculite',
  'cairotiles',
  'guilloche',
  'seaurchintest',
  'crystallineglaze',
  'shirring',
  'sunburstveneer',
  'rakedgravel',
  'flintwall',
  'frenchknots',
  'artichoke',
  'splitlockwashers',
  'flemishbond',
  'satinweave',
  'lotusroot',
  'cardboardedge',
  'hexnuts',
  'capnuts',
  'flangenuts',
  'calcite',
  'halite',
  'waffleweave',
  'fishscaleshingles',
  'starfish',
  'snubsquaretiles',
  'rhombitrihexagonaltiles',
  'elongatedtriangulartiles',
  'truncatedtrihexagonaltiles',
  'kisrhombilletiles',
  'chladnifigure',
  'sierpinskicarpet',
  'moorecurve',
  'papertape',
  'ulamspiral',
  'sevensegment',
  'perfectmaze',
  'rule30',
  'embossedbraille',
  'ean13label',
  'soroban',
  'deltoidaltrihexagonaltiles',
  'snubtrihexagonaltiles',
  'floretpentagonaltiles',
  'prismaticpentagonaltiles',
  'apollonianmosaic',
  'ichinghexagrams',
  'pythagorastree',
  'pentominotiles',
  'langtonsant',
  'vogelspiral',
  'gosperinlay',
  'pallasite',
  'cuttlebone',
  'watermelontourmaline',
  'leafstomata',
  'chitonshells',
  'radiolariandiscs',
  'diatomvalves',
  'orbicularjasper',
  'acornbarnacles',
  'circularpavers',
  'snowflaketiles',
  'sawblades',
  'pistachios',
  'polkadotfabric',
  'cucumberslices',
  'monsteraleaf',
  'crossstitch',
  'staranise',
  'logcabinparquet',
  'countersunkmetal',
  'trilobitefossil',
  'eyeletcotton',
  'dendriticagate',
  'ravioli',
  'rollerchain',
  'mapleleaf',
  'smocking',
  'quatrefoiltile',
  'okraslice',
  'eggcarton',
  'greekkey',
  'seedbeads',
  'chainstitch',
  'wingnuts',
  'pomegranateslice',
  'pawprinttiles',
  'dovetailjoint',
  'starsocketbolts',
  'sanddollar',
  'brogueleather',
  'clovebuds',
  'starcrosstiles',
  'maplesamara',
  'lenoweave',
  'circlips',
  'eclips',
  'tuliptiles',
  'gingerslice',
  'fivebarplate',
  'cinnamonswirl',
  'wheatears',
  'scalemail',
  'trihexagonaltiles',
  'burlwood',
  'slottedmetal',
  'peppercorns',
  'castellatednuts',
  'farfalle',
  'cardamompods',
  'brickarches',
  'knottednet',
  'fiddleheads',
  'cowrieshells',
  'cotterpins',
  'garterstitch',
  'seedstitch',
  'mangosteenslice',
  'pickettiles',
  'squarewashers',
  'eucalyptusleaf',
  'twillweave',
  'pumpkinseeds',
  'spurgears',
  'diamondcheckertiles',
  'appleslice',
  'paperclips',
  'rclips',
  'linchpins',
  'woodruffkeys',
  'dowelpins',
  'clevispins',
  'gibheadkeys',
  'parallelkeys',
  'ivyleaf',
  'ribknit',
  'pillowtiles',
  'coffeerings',
  'cashews',
  'hinges',
  'coins',
  'righttriangletiles',
  'cherryblossom',
  'punchcard',
  'braidedcord',
  'crossbeddedsandstone',
  'grommetcanvas',
  'fishscaletiles',
  'hexkeys',
  'driedfigslice',
  'creamcrackers',
  'doorkeys',
  'dodecagontiles',
  'ballchain',
  'succulentrosettes',
  'foldingfans',
  'togglebuttons',
  'greenpeapods',
  'beltbuckles',
  'hextruchettiles',
  'scoredmango',
  'waxseals',
  'cottonbolls',
  'carabiners',
  'pencilends',
  'corrugatedplasticedge',
  'haircombs',
  'blackberries',
  'musselshells',
  'safetypins',
  'poppyseedpods',
  'leatherbookspines',
  'matchsticks',
  'porcelaininsulators',
  'dominoes',
  'woodenspoons',
  'chessrooks',
  'threadspools',
  'bellpepperslices',
  'sharkteeth',
  'grinderburrs',
  'cowhide',
  'spaltedwood',
  'canlids',
  'crinoidossicles',
  'pythagoreantiles',
  'dinnerforks',
  'goldbrocade',
  'mudtiretracks',
  'peacockfeathers',
  'tangramtiles',
  'batterypositivecaps',
  'passionfruitslice',
  'screwterminalblocks',
  'dragonfruitflesh',
  'speakercones',
  'septarianstone',
  'axialresistors',
  'tomatoslices',
  'pinstripewool',
  'chrysanthemumstone',
  'snowflakeobsidian',
  'sewingsnaps',
  'lathplaster',
  'ceramiccapacitors',
  'fennelseeds',
  'rj45femalefaces',
  'rcafemalefaces',
  'f05opticalfaces',
  'minidin4femalefaces',
  'dcbarreljackfaces',
  'stfiberadapterfaces',
  'to92packagefaces',
  'ludoboard',
  'chessopening',
  'xiangqiboard',
  'cribbageboard',
  'monopolyboard',
  'scrabbleboard',
  'duccirows',
  'wireworldcircuit',
  'cycliccellular',
  'beattypartition',
  'walshmatrix',
  'paperfoldingruler',
  'rudinshapirogrid',
  'baumsweetgrid',
  'binarynecklaces',
  'catalantriangulations',
  'eisensteinprimes',
  'keplerorbit',
  'pythagoreanproof',
  'contributiongraph',
  'arbelos',
  'eulerlinetriangle',
  'astroidladder',
  'slopegraph',
  'kolakoskisequence',
  'crcdivision',
  'lfsrstates',
  'fareysequence',
  'unionfindmerges',
  'linearprobing',
  'bloomfilter',
  'gamblersruin',
  'nimgame',
  'wordlefeedback',
  'funnelchart',
  'lrucachetrace',
  'prefixtrie',
  'knapsacktable',
  'bfswavefront',
  'bresenhamlines',
  'mergesortruns',
  'radixsortpasses',
  'paretochart',
  'vernierscale',
  'kmpfailure',
  'dijkstragrid',
  'binarysearchsteps',
  'quicksortsteps',
  'ganttschedule',
  'lorenzcurve',
  'zordercurve',
  'histogrambins',
  'sankeyflows',
  'bodeplots',
  'huffmancodes',
  'hashchains',
  'editdistance',
  'nearesttour',
  'karnaughmap',
  'bsttreeorder',
  'kdtreesplits',
  'spanningtree',
  'ecdfplot',
  'intervalpartition',
  'waterfallchart',
  'chorddiagrams',
  'qamconstellation',
  'countertimings',
  'hofstadterq',
  'semaphorefigures',
  'fenwicktree',
  'jacobisymbols',
  'vicsekfractal',
  'segmenttree',
  'rankchevrons',
  'windbarbs',
  'compassrose',
  'smithchart',
  'mahjongdots',
  'qrcodemodules',
  'gaugedials',
  'flagpatterns',
  'intelhexrecords',
  'equalizerbars',
  'worleycells',
  'errordiffusion',
  'tetrominoes',
  'candlestickcharts',
  'paleygraphmatrix',
  'superformulacells',
  'tsquarefractal',
  'marchingsquares',
  'wangtiles',
  'htreefractal',
  'lsystemplant',
  'quadtreecells',
  'countingrods',
  'braiddiagram',
  'youngtableaux',
  'euclidsquares',
  'voronoicells',
  'cliffordattractor',
  'peanocurve',
  'bitwisetable',
  'golombrulers',
  'henonattractor',
  'digitalroottable',
  'thuemorsegrid',
  'recamanarcs',
  'happynumberchains',
  'lookandsayrows',
  'kaprekarsteps',
  'roundrobintable',
  'roulettewheel',
  'circleoffifths',
  'periodictablecells',
  'josephuscircle',
  'gaussianprimes',
  'timestablecircles',
  'divisorcountbars',
  'cobwebplots',
  'sierpinskipascal',
  'sacksspiral',
  'dyckpaths',
  'figuratenumbers',
  'pythagoreantriples',
  'hexdumprows',
  'pairingtables',
  'ferrersdiagrams',
  'zeckendorfrows',
  'cycloidcusps',
  'sternbrocottree',
  'projectilearcs',
  'isbn10checks',
  'runlengthrows',
  'graphcoloring',
  'bubblesortpasses',
  'binaryheaptree',
  'dicesumbars',
  'substitutionwords',
  'stemandleaf',
  'boxplots',
  'sorobanabacus',
  'numberwords',
  'dipolefieldlines',
  'mobiusgrid',
  'fordcircles',
  'vectorfieldarrows',
  'wordsquares',
  'caesarcipher',
  'baseconversion',
  'primefactors',
  'modularpowers',
  'burningship',
  'logisticbifurcation',
  'bitwiselogic',
  'gcdtable',
  'percolationclusters',
  'abeliansandpile',
  'binaryaddition',
  'roundingmodes',
  'bellcurvebands',
  'ieee754floats',
  'vennregions',
  'bezierconstruction',
  'luhnnumbers',
  'twosourceripples',
  'cassiniovals',
  'rosecurves',
  'conicsections',
  'cantorsetrows',
  'mandelbrotbands',
  'newtonbasins',
  'kochsnowflake',
  'matrixproducts',
  'signedencodings',
  'romannumerals',
  'cayleytables',
  'hammingcodewords',
  'collatzsequences',
  'delaunaytriangles',
  'convexhullpoints',
  'pascaltrianglenumbers',
  'fouriersquarewaves',
  'truthtablelogic',
  'barchartbars',
  'regressionscatter',
  'piechartwedges',
  'analogclocks',
  'treemaprects',
  'moonphases',
  'multiplicationtable',
  'draughtsposition',
  'colormapregions',
  'chinesecheckersboard',
  'euclideanrhythms',
  'hidatochain',
  'mancalaboard',
  'rushhourjam',
  'numberlinkpaths',
  'kenkencages',
  'takuzugrid',
  'akarilights',
  'hitorishading',
  'shikakurects',
  'tentsandtrees',
  'nurikabeislands',
  'futoshikigrid',
  'fillominoregions',
  'stringartcurves',
  'masyupearls',
  'slitherlinkloop',
  'hashibridges',
  'kakuropuzzle',
  'hexresourceboard',
  'bowlingscoresheet',
  'dewbeads',
  'goboards',
  'othelloboard',
  'binaryclock',
  'pianoroll',
  'skyscraperpuzzles',
  'knockoutbracket',
  'primesieve',
  'sortingnetworks',
  'mayansums',
  'latinsquares',
  'hanoitowers',
  'eightqueens',
  'cantordust',
  'dragoncurve',
  'pascalmodulo',
  'gameoflife',
  'oghaminscription',
  'kaleidoscope',
  'slidingpuzzle',
  'magicsquares',
  'wordsearchgrid',
  'mastermindboard',
  'elementaryautomata',
  'bluenoisemask',
  'fibonaccisquares',
  'doubleslitfringes',
  'sundialplate',
  'ledgersheet',
  'louvershutter',
  'chesterfieldtufting',
  'polargraphpaper',
  'tallymarks',
  'quasicrystalwaves',
  'tictactoegames',
  'dartboardsectors',
  'featherbarbs',
  'amidakuji',
  'code39barcodes',
  'graycodediscs',
  'knightstour',
  'scrambledcubenet',
  'weavingdraft',
  'lightsoutboard',
  'nonogrampuzzle',
  'juliacells',
  'spirographrosettes',
  'sliderulescale',
  'xylophonebars',
  'pegsolitaire',
  'bingocard',
  'connectfourboard',
  'ramennoodles',
  'jigsawpuzzle',
  'backgammonboard',
  'zoneplates',
  'lissajousgrid',
  'mondriancomposition',
  'hilbertcurve',
  'battleshipgrid',
  'tetrisstack',
  'minesweeperboard',
  'flipdotdisplay',
  'crosswordgrid',
  'fretboard',
  'calendarpage',
  'measuringtape',
  'sudokugrid',
  'sheetmusic',
  'ecgpaper',
  'datamatrixcodes',
  'frostpolygons',
  'sandripples',
  'morsetape',
  'ean13barcodes',
  'kilimflatweave',
  'tumblingblocks',
  'azulejotiles',
  'moirefringes',
  'cinderblockwall',
  'dicefaces',
  'needlepoint',
  'mandalaflower',
  'kiwislices',
  'hazardstripes',
  'radarscope',
  'digitalcamo',
  'topographiccontours',
  'garnetschist',
  'celticplait',
  'atomicboomerang',
  'lawnstripes',
  'asphaltshingle',
  'expandedpolystyrene',
  'octopussuckers',
  'ammonitestone',
  'amberresin',
  'patchworkquilt',
  'bayerdither',
  'turingpattern',
  'mudcloth',
  'to220packagefaces',
  'ftypefemalefaces',
  'usbcfemalefaces',
  'iecc6inlets',
  'iecc8inlets',
  'din5femalefaces',
  'xlrfemalefaces',
  'bncfemalefaces',
  'iecc14inlets',
  'dsubsocketfaces',
  'topadjusttrimmers',
  'crownprobetips',
  'piezodiaphragms',
  'castellatedboards',
  'qfnlandpads',
  'bgasolderballs',
  'ballbearingfaces',
  'baseballleather',
  'toothbrushheads',
  'bowtieinlay',
  'redcabbagecut',
  'slottedturners',
  'triglidesliders',
  'popcorn',
  'dualinlinechips',
  'tortoiseshellacetate',
  'cathedralquilt',
  'matelasse',
  'silknoil',
  'buckwheathulls',
  'rutilatedquartz',
  'peppermintcanes',
  'rubbergrommets',
  'chioggiabeetcuts',
  'flatflexcables',
  'celerycuts',
  'tactileswitches',
  'paisleybrocade',
  'siliconepastrybrushes',
  'graphicgranite',
  'brasspadlocks',
  'carrotcuts',
  'bluepushpins',
  'oatflakes',
  'tigerfur',
  'grosgrainribbons',
  'azuritemalachite',
  'openendspanners',
  'lentilseeds',
  'blueprintpaper',
  'horsechestnutleaf',
  'binderclips',
  'charoite',
  'chenilleyarn',
  'ceramicfuses',
  'hazelnutshells',
  'yagasuricloth',
  'balloonwhisks',
  'orthocerasstone',
  'rickracktrim',
  'toroidalinductors',
  'pennerigate',
  'lepidolitemica',
  'brassjinglebells',
  'nutmeghalves',
  'coaxialcablecuts',
  'shippocloth',
  'driedtamarindpods',
  'conicalsampletubes',
  'botryoidalcopper',
  'pencilshavings',
  'papayacuts',
  'sewingthimbles',
  'boullebrassinlay',
  'diamondpanelparquet',
  'dendriticfrost',
  'bullionknots',
  'orecchiette',
  'solderlessbreadboard',
  'kyaniteblades',
  'wulfenite',
  'staurolite',
  'azurite',
  'celestine',
  'barite',
  'internaltoothwashers',
  'driedchillies',
  'utilityknifeblades',
  'windmillparquet',
  'bismuthhoppers',
  'splitvanillapods',
  'seamrippers',
  'flakedarrowheads',
  'dandelionseeds',
  'shojipaperlattice',
  'nyloncableties',
  'weavingshuttles',
  'tailorstapes',
  'woodenclothespins',
  'cinnamonbarkcoils',
  'compactcassettefaces',
  'kintsugiceramic',
  'pleatedfilterpapers',
  'splitcedarshakes',
  'swavepavers',
  'mushroomslices',
  'insulatedringlugs',
  'bananaslices',
  'rosemarysprigs',
  'pencilsharpeners',
  'scissors',
  'serpentinesprings',
  'impellerfaces',
  'chipresistors',
  'memorycardbacks',
  'gnocchi',
  'rectangularsocketfaces',
  'saffronthreads',
  'fishhooks',
  'violinfholes',
  'palmiers',
  'barbedwire',
  'oxfordweave',
  'lacewood',
  'papyrus',
  'larimar',
  'paperbark',
  'horseshoes',
  'durianpeel',
  'flystitch',
  'abaloneshells',
  'gyroidinfill',
  'cloisonne',
  'rambutanskin',
  'rackgears',
  'grosgrain',
  'faille',
  'bedfordcord',
  'poplin',
  'ooliticlimestone',
  'ogeetiles',
  'bittermelonskin',
  'cocobolo',
  'doubleedgerazorblades',
  'chiastolite',
  'dimity',
  'juniperberries',
  'gabbro',
  'turnbuckles',
  'rhodochrosite',
  'bluelaceagate',
  'bayleaf',
  'whipcord',
  'gabardine',
  'oilspotglaze',
  'persimmonslice',
  'kitkattiles',
  'brakediscs',
  'mulberrypaper',
  'howlite',
  'sodalite',
  'ottoman',
  'shackles',
  'watercaltrops',
  'fluorite',
  'vanadinite',
  'pyromorphite',
  'redberyl',
  'cavansite',
  'wenge',
  'parchment',
  'cavalrytwill',
  'screwhooks',
  'nigellaseeds',
  'phyllite',
  'shantung',
  'hempcrete',
  'utilityblades',
  'chrysocolla',
  'hemimorphite',
  'smithsonite',
  'sichuanpepperhusks',
  'huckaback',
  'anorthosite',
  'cubebberries',
  'seraphinite',
  'hexsocketheads',
  'datepits',
  'sapele',
  'chambray',
  'ticking',
  'cottondrill',
  'nephrite',
  'diorite',
  'carawayseeds',
  'springpinends',
  'rhyolite',
  'tonkabeans',
  'pentalobescrewheads',
  'padauk',
  'cottonflannel',
  'pinolith',
  'tripointscrewheads',
  'septarian',
  'squaresocketheads',
  'trianglesocketheads',
  'pietersite',
  'bronzite',
  'castorbeans',
  'zebrawood',
  'bocote',
  'europeanbeech',
  'whiteoak',
  'whiteash',
  'kingwood',
  'braziliantulipwood',
  'macassarebony',
  'twopinscrewheads',
  'amazonite',
  'blackeyedpeas',
  'adzukibeans',
  'anigre',
  'makore',
  'larvikite',
  'squareholewashers',
  'tigerwood',
  'snakewood',
  'safflowerseeds',
  'thulite',
  'unakite',
  'eudialyte',
  'lignumvitae',
  'iroko',
  'purpleheart',
  'yellowheart',
  'bloodwood',
  'basswood',
  'tabwashers',
  'sphericalwashers',
  'mungbeans',
  'thomsonite',
  'dalmatianstone',
  'nickelsilver',
  'hopsack',
  'monkscloth',
  'lyocell',
  'sateen',
  'surah',
  'serge',
  'habotai',
  'batiste',
  'ramie',
  'wavewashers',
  'cupwashers',
];
const repeatSampler = Object.freeze({
  addressModeU: 'repeat',
  addressModeV: 'repeat',
} as const);

/** Owns four generated maps. Materials, meshes and scenes only borrow them. */
export class ProceduralMaterial {
  readonly kind: ProceduralMaterialKind;
  readonly textures: Readonly<ProceduralTextures>;
  readonly material: PBRMaterial;
  private disposed = false;

  private constructor(
    kind: ProceduralMaterialKind,
    textures: ProceduralTextures,
    readonly repeats: number,
  ) {
    this.kind = kind;
    this.textures = Object.freeze(textures);
    this.material = this.createMaterial();
  }

  static async create(
    kind: ProceduralMaterialKind,
    options: ProceduralMaterialOptions = {},
  ): Promise<ProceduralMaterial> {
    if (!kinds.includes(kind))
      throw new RangeError('Unknown procedural material kind.');
    if (!options || typeof options !== 'object' || Array.isArray(options))
      throw new TypeError('Procedural material options must be an object.');
    const size =
      options.size === undefined
        ? proceduralMaterialLimits.defaultSize
        : options.size;
    const seed =
      options.seed === undefined
        ? proceduralMaterialLimits.defaultSeed
        : options.seed;
    if (
      !Number.isInteger(size) ||
      size < proceduralMaterialLimits.minSize ||
      size > proceduralMaterialLimits.maxSize
    )
      throw new RangeError(
        'Procedural material size must be an integer between 32 and 1024.',
      );
    if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff)
      throw new RangeError(
        'Procedural material seed must be an unsigned 32-bit integer.',
      );
    const contrast = options.contrast ?? 1;
    const roughnessBias = options.roughnessBias ?? 0;
    const repeats = options.repeats ?? 1;
    if (
      !Number.isFinite(contrast) ||
      contrast < 0 ||
      !Number.isFinite(roughnessBias) ||
      roughnessBias < -1 ||
      roughnessBias > 1 ||
      !Number.isFinite(repeats) ||
      repeats <= 0
    )
      throw new RangeError(
        'Procedural contrast must be finite and nonnegative, roughnessBias within -1..1, and repeats finite and positive.',
      );
    const tint = options.tint;
    if (
      tint !== undefined &&
      (!Array.isArray(tint) ||
        tint.length !== 3 ||
        !tint.every(
          (value) =>
            typeof value === 'number' &&
            Number.isFinite(value) &&
            value >= 0 &&
            value <= 4,
        ))
    )
      throw new RangeError(
        'Procedural tint must be three finite multipliers within 0..4.',
      );
    if (
      options.heightMap !== undefined &&
      typeof options.heightMap !== 'boolean'
    )
      throw new TypeError('Procedural heightMap must be a boolean.');
    const pool = options.workerPool;
    if (pool !== undefined && !(pool instanceof NativeWorkerPool))
      throw new TypeError('Procedural workerPool must be a NativeWorkerPool.');
    const cache = options.cache;
    if (cache !== undefined && !(cache instanceof ProceduralMapCache))
      throw new TypeError('Procedural cache must be a ProceduralMapCache.');
    const request: ProceduralMapsRequest = {
      kind,
      size,
      seed,
      contrast,
      roughnessBias,
      heightMap: options.heightMap ?? false,
      ...(tint === undefined ? {} : { tint: [tint[0], tint[1], tint[2]] }),
    };
    const generate = async (): Promise<ProceduralMaps> => {
      if (pool === undefined)
        return generateProceduralMaps(kind, size, seed, {
          contrast,
          roughnessBias,
          tint,
          heightMap: request.heightMap,
        });
      const generated = (
        await pool.submit(proceduralMapsJob, request, { requestBytes: 0 })
          .promise
      ).value;
      if (
        generated.baseColor.length !== size * size * 4 ||
        (request.heightMap && generated.height?.length !== size * size * 4)
      )
        throw new RangeError('Worker procedural maps do not match their size.');
      return generated;
    };
    const maps =
      cache === undefined
        ? await generate()
        : await cache.acquire(request, generate);
    const acquired: Texture[] = [];
    // Sequential acquisition keeps cleanup deterministic even when decoding a later map fails.
    try {
      for (const pixels of [
        maps.baseColor,
        maps.normal,
        maps.metallicRoughness,
        maps.occlusion,
        ...(maps.height === undefined ? [] : [maps.height]),
      ]) {
        const image = new ImageData(size, size);
        image.data.set(pixels);
        acquired.push(await Texture.fromImage(image));
      }
      return new ProceduralMaterial(
        kind,
        {
          baseColor: acquired[0]!,
          normal: acquired[1]!,
          metallicRoughness: acquired[2]!,
          occlusion: acquired[3]!,
          ...(acquired[4] === undefined ? {} : { height: acquired[4] }),
        },
        repeats,
      );
    } catch (error) {
      for (const texture of acquired) texture.destroy();
      throw error;
    }
  }

  /** Creates an independent material borrowing these maps; overrides never transfer ownership. */
  createMaterial(options: Partial<PBRMaterialOptions> = {}): PBRMaterial {
    if (this.disposed)
      throw new Error(
        'Cannot create a material from a destroyed procedural preset.',
      );
    const scale = [this.repeats, this.repeats] as const;
    return new PBRMaterial({
      texture: this.textures.baseColor,
      normalTexture: this.textures.normal,
      metallicRoughnessTexture: this.textures.metallicRoughness,
      occlusionTexture: this.textures.occlusion,
      ...(this.textures.height === undefined
        ? {}
        : {
            opticalMaps: {
              heightTexture: this.textures.height,
              heightSampler: repeatSampler,
            },
          }),
      textureCoordinates:
        this.repeats === 1
          ? undefined
          : {
              texture: { scale },
              metallicRoughness: { scale },
              normal: { scale },
              occlusion: { scale },
              ...(this.textures.height === undefined
                ? {}
                : { height: { scale } }),
            },
      metallic:
        this.kind === 'nickelsilver' ||
        this.kind === 'metal' ||
        this.kind === 'rust' ||
        this.kind === 'copperpatina' ||
        this.kind === 'chippedenamel' ||
        this.kind === 'gabion' ||
        this.kind === 'grommetcanvas' ||
        this.kind === 'goldbrocade' ||
        this.kind === 'batterypositivecaps' ||
        this.kind === 'screwterminalblocks' ||
        this.kind === 'axialresistors' ||
        this.kind === 'sewingsnaps' ||
        this.kind === 'ceramiccapacitors' ||
        this.kind === 'slottedturners' ||
        this.kind === 'dualinlinechips' ||
        this.kind === 'flatflexcables' ||
        this.kind === 'tactileswitches' ||
        this.kind === 'brasspadlocks' ||
        this.kind === 'bluepushpins' ||
        this.kind === 'openendspanners' ||
        this.kind === 'turnbuckles' ||
        this.kind === 'binderclips' ||
        this.kind === 'ceramicfuses' ||
        this.kind === 'balloonwhisks' ||
        this.kind === 'toroidalinductors' ||
        this.kind === 'brassjinglebells' ||
        this.kind === 'coaxialcablecuts' ||
        this.kind === 'botryoidalcopper' ||
        this.kind === 'sewingthimbles' ||
        this.kind === 'boullebrassinlay' ||
        this.kind === 'internaltoothwashers' ||
        this.kind === 'utilityknifeblades' ||
        this.kind === 'bismuthhoppers' ||
        this.kind === 'seamrippers' ||
        this.kind === 'weavingshuttles' ||
        this.kind === 'woodenclothespins' ||
        this.kind === 'kintsugiceramic' ||
        this.kind === 'cloisonne' ||
        this.kind === 'gosperinlay' ||
        this.kind === 'pallasite' ||
        this.kind === 'rackgears' ||
        this.kind === 'doubleedgerazorblades' ||
        this.kind === 'brakediscs' ||
        this.kind === 'shackles' ||
        this.kind === 'screwhooks' ||
        this.kind === 'utilityblades' ||
        this.kind === 'hexsocketheads' ||
        this.kind === 'squaresocketheads' ||
        this.kind === 'trianglesocketheads' ||
        this.kind === 'twopinscrewheads' ||
        this.kind === 'squareholewashers' ||
        this.kind === 'tabwashers' ||
        this.kind === 'sphericalwashers' ||
        this.kind === 'wavewashers' ||
        this.kind === 'cupwashers' ||
        this.kind === 'pentalobescrewheads' ||
        this.kind === 'tripointscrewheads' ||
        this.kind === 'springpinends' ||
        this.kind === 'insulatedringlugs' ||
        this.kind === 'pencilsharpeners' ||
        this.kind === 'scissors' ||
        this.kind === 'serpentinesprings' ||
        this.kind === 'impellerfaces' ||
        this.kind === 'chipresistors' ||
        this.kind === 'memorycardbacks' ||
        this.kind === 'rectangularsocketfaces' ||
        this.kind === 'fishhooks' ||
        this.kind === 'barbedwire' ||
        this.kind === 'horseshoes' ||
        this.kind === 'rj45femalefaces' ||
        this.kind === 'rcafemalefaces' ||
        this.kind === 'minidin4femalefaces' ||
        this.kind === 'dcbarreljackfaces' ||
        this.kind === 'stfiberadapterfaces' ||
        this.kind === 'to92packagefaces' ||
        this.kind === 'hazardstripes' ||
        this.kind === 'to220packagefaces' ||
        this.kind === 'ftypefemalefaces' ||
        this.kind === 'usbcfemalefaces' ||
        this.kind === 'iecc6inlets' ||
        this.kind === 'iecc8inlets' ||
        this.kind === 'xlrfemalefaces' ||
        this.kind === 'bncfemalefaces' ||
        this.kind === 'iecc14inlets' ||
        this.kind === 'dsubsocketfaces' ||
        this.kind === 'topadjusttrimmers' ||
        this.kind === 'crownprobetips' ||
        this.kind === 'piezodiaphragms' ||
        this.kind === 'castellatedboards' ||
        this.kind === 'qfnlandpads' ||
        this.kind === 'bgasolderballs' ||
        this.kind === 'ballbearingfaces' ||
        this.kind === 'diamondplate' ||
        this.kind === 'hammeredmetal' ||
        this.kind === 'galvanized' ||
        this.kind === 'corrugatedmetal' ||
        this.kind === 'standingseam' ||
        this.kind === 'damascus' ||
        this.kind === 'castiron' ||
        this.kind === 'pressedtin' ||
        this.kind === 'louveredmetal' ||
        this.kind === 'crowncaps' ||
        this.kind === 'rebar' ||
        this.kind === 'guilloche' ||
        this.kind === 'splitlockwashers' ||
        this.kind === 'hexnuts' ||
        this.kind === 'capnuts' ||
        this.kind === 'flangenuts' ||
        this.kind === 'wingnuts' ||
        this.kind === 'circlips' ||
        this.kind === 'eclips' ||
        this.kind === 'fivebarplate' ||
        this.kind === 'scalemail' ||
        this.kind === 'slottedmetal' ||
        this.kind === 'castellatednuts' ||
        this.kind === 'cotterpins' ||
        this.kind === 'squarewashers' ||
        this.kind === 'spurgears' ||
        this.kind === 'paperclips' ||
        this.kind === 'rclips' ||
        this.kind === 'linchpins' ||
        this.kind === 'woodruffkeys' ||
        this.kind === 'dowelpins' ||
        this.kind === 'clevispins' ||
        this.kind === 'gibheadkeys' ||
        this.kind === 'parallelkeys' ||
        this.kind === 'hinges' ||
        this.kind === 'coins' ||
        this.kind === 'ballchain' ||
        this.kind === 'doorkeys' ||
        this.kind === 'beltbuckles' ||
        this.kind === 'carabiners' ||
        this.kind === 'safetypins' ||
        this.kind === 'grinderburrs' ||
        this.kind === 'canlids' ||
        this.kind === 'dinnerforks' ||
        this.kind === 'hexkeys' ||
        this.kind === 'starsocketbolts' ||
        this.kind === 'sawblades' ||
        this.kind === 'countersunkmetal' ||
        this.kind === 'rollerchain' ||
        this.kind === 'perforatedmetal' ||
        this.kind === 'expandedmetal' ||
        this.kind === 'wiremesh' ||
        this.kind === 'draincover' ||
        this.kind === 'pyrite' ||
        this.kind === 'knurledmetal' ||
        this.kind === 'engineturned' ||
        this.kind === 'goldleaf' ||
        this.kind === 'chainmail' ||
        this.kind === 'rivetedmetal' ||
        this.kind === 'weldedmetal'
          ? 1
          : 0,
      roughness: 1,
      alphaMode: 'OPAQUE',
      textureSampler: repeatSampler,
      normalSampler: repeatSampler,
      metallicRoughnessSampler: repeatSampler,
      occlusionSampler: repeatSampler,
      ...options,
    });
  }

  get destroyed(): boolean {
    return this.disposed;
  }

  /** Remove every consumer before releasing this preset's maps. Does not destroy materials. */
  destroy(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.textures.baseColor.destroy();
    this.textures.normal.destroy();
    this.textures.metallicRoughness.destroy();
    this.textures.occlusion.destroy();
    this.textures.height?.destroy();
  }
}
