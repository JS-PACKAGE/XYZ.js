---
title: Current contracts · v1.19
---

# XYZ.js v1.19 — current contracts

**Normative for package 1.19.0, Apache-2.0, browser runtime, zero runtime dependencies.** npm remains unpublished. This page describes current supported profiles including P104–P118, not an acceptance report or upstream compatibility promise. [GitHub v1.16](https://github.com/JS-PACKAGE/XYZ.js/releases/tag/v1.16) is published after the existing CI gate, with its downloaded archive/checksum verified; the historical v1.14 archive does not contain P104–P118. Historical dates, test counts, release versions and originally excluded features remain in [ACCEPTANCE](https://github.com/JS-PACKAGE/XYZ.js/blob/main/ACCEPTANCE.md). English / 繁體中文 / 日本語：目前契約／現在の契約。Older exclusions do not override the current profiles below.

## Public API and distribution

The supported public entry is `xyz.js` (or the complete built tree's `engine/src/index.js` on the static site). It exports core, graphics, math, assets, input and audio; ECS is an internal model, not a separate root export. Use the generated **API v1.19.0** portal for exact classes, types, methods and overloads. Its search includes API names, comments and this document; inherited members can be shown with the visibility filters.

`pnpm docs:api` generates `.vite/site/api/1.19.0/` and its documentation landing pages. `pnpm build:site` builds the examples and the same searchable API into the complete `.vite/site/` distribution. Serve over HTTP/HTTPS and open `docs/` or `api/1.19.0/`; generated HTML is not tracked or included in the engine tarball. Relative API links and search assets stay within the version directory, so deployment under a path prefix does not require URL rewriting. Source documentation is not a claim that the hosted site has been deployed.

For standalone consumers, build and pack, then use `node scripts/create-game.mjs /absolute/my-game --template 2d --package /absolute/xyz.js-1.19.0.tgz --name my-game` (or `3d`). Deploy the complete starter `dist/`. No-bundler engine deployment likewise requires the complete engine `dist/`, including the unchanged official `dist/vendor/opm/` distribution and licenses.

CommonJS and ESM use separate constructor graphs. Choose one format for every
engine object in an application; cross-format Texture/Scene/Mesh instances are
not interchangeable. Canonical type declarations do not imply shared runtime
identity. CDN metadata selects ESM; the GitHub release does not publish npm.

## Capability matrix

These are implementation profiles, **not three-backend equivalence or physical qualification**. Check `game.graphics.capabilities` and optional renderer methods instead of inferring support from the backend name.

| Surface                                                                                    | WebGPU                                          | WebGL2                                          | Canvas2D / shared boundary                                                                            |
| ------------------------------------------------------------------------------------------ | ----------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Sprite, atlas, text, HUD/UI, raster paths, isolation, masks, basic blends, render textures | Supported                                       | Supported                                       | Supported; raster paths/text are texture-backed, not native vector tessellation                       |
| Native Material2D, Filter2D, Mesh2D, shader postprocessing                                 | Supported, native WGSL                          | Supported, native GLSL                          | Explicitly unsupported; no software shader/3D fallback                                                |
| Mesh/PBR, instancing, skinning, shadows, 3D postprocessing                                 | Supported                                       | Supported subject to capabilities/extensions    | No visible 3D; HDR/weighted transparency on GL require float color attachments                        |
| Native compressed textures / supplied mips                                                 | Capability-gated formats                        | Capability-gated formats                        | Native sources rejected; select a real raster fallback                                                |
| GPU 3D particles                                                                           | Native analytic vertex particles; prepare first | Native analytic vertex particles; prepare first | Explicitly unsupported; CPU Sprite-particle profiles remain available                                 |
| Initialization                                                                             | `auto` tries WebGPU → WebGL2 → Canvas2D         | Forced backend never switches                   | `auto` fallback is initialization-only                                                                |
| Runtime loss                                                                               | Default same-backend recovery                   | Default same-backend recovery                   | Recreate renderer-owned targets/snapshots after recovery; failure or `recoverGraphics:false` is fatal |

WebGPU and AudioWorklet require a secure origin (localhost is allowed). Device availability is not implied by `navigator.gpu`; the current public compute profile is the bounded WebGPU-only ComputeProgram/ComputeBuffer API. Native shader/particle descriptors must be prepared before rendering; callers own their destruction after removing consumers. Auto presentation uses a copy to the original canvas and is not a performance-equivalent forced backend.

Mesh programs/pipelines are lazy, feature-keyed and bounded to 64 cached entries.
Zero-strength physical lobes are omitted from ordinary shader source. Cold synchronous
draws still compile synchronously; explicit preparation uses available parallel/async
driver compilation. Native hooks retain conservative full shading and recovery preparation.

## Shared subsystem profiles

| Surface                         | Current support and important bounds                                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lifecycle / simulation          | Game/Scene ownership, atomic prepared-scene publication, cooperative abort, fixed gameplay updates and opt-in physics interpolation. Time is seconds; pause/hidden time does not accumulate. Do not update physics again inside `fixedUpdate`.                                                                                                          |
| Assets / glTF                   | Task-based preload, manifest/bundles, ResourcePool leases/scopes, bounded streamed reads and cleanup. glTF triangles, UV0/UV1, independent per-map texture transforms, four/eight skin influences, morph and `COLOR_0`; `COLOR_1` and unsupported required extensions reject. Meshopt is built in; Draco/Basis use explicitly supplied external codecs. |
| Asset production                | Semantic platform bundles contain capability-selected variants and a codec-free raster fallback. Preflight accepts `TEXCOORD_0` and `TEXCOORD_1`, requires each textured primitive's selected stream, and keeps material-map transforms independent. Default KTX2 decoding is base-level RGBA8; native sources preserve supported payloads/mips.        |
| Physics2D                       | Dynamic/static/kinematic bodies, sleep, five joints, static concave decomposition/chains, convex character sweep/slide/platform carry and bounded relative translation/rotation CCD. Sensors are discrete; no dynamic concave/compound/deforming sweeps.                                                                                                |
| Physics3D / navigation          | Bounded primitive dynamic bodies, joints, relative/angular CCD, capsule character/crouch/moving support, queries; graphs, polygon navmeshes, layered/partitioned sampled worlds and collision-derived navigation use documented work/storage quotas, not unlimited world size.                                                                          |
| Animation                       | Ordered layers, masks, reference-relative additive animation, fades/crossfades, state machines, 1D/triangulated 2D blend trees, two-bone IK, GPU skinning with lazy CPU queries and conservative animated bounds.                                                                                                                                       |
| Content / input / accessibility | Tiled JSON including bounded infinite chunks/groups/parallax/animation/templates; input contexts, remapping and portable settings/saves; semantic-only DOM focus/activation mirror. A semantic mirror is not DOM-rendered gameplay or assistive-technology certification.                                                                               |
| Audio                           | Immutable official OPM.js v1.11.1 bytes (tag v1.11.1), eight slots/contexts including release; native samples reuse the first unlocked context. Gesture unlock precedes decode/play; Game pause does not automatically pause audio. Native effects/automation/ducking/world bindings do not imply audible hardware verification.                        |
| Scale / rendering budgets       | Visibility/LOD/HLOD, streaming, workers, bounded light/shadow selection and observability. Worker results still incur main-thread Geometry validation/copy. Per Scene: up to 1024 point and 1024 spot lights; per draw: 32 each; shadows: four cascades/eight point/eight spot.                                                                         |
| Deployment / compatibility      | 1.x additive profiles, optional renderer extensions, standalone 2D/3D starters, strict-CSP hosting and opt-in offline assets. Offline support does not cache arbitrary missing resources or relax origin/security rules.                                                                                                                                |

Official OPM.js v1.11.1 (tag `v1.11.1`) normalizes voices to v7 internally; the engine-exposed `OPMVoice` retains the published `version: 1` contract. `game.audio.opm` is the engine's legacy compatibility facade backed by the first official instance, not that native instance itself. It preserves writable context/node handles and a mutable voice `Map` with v1 voices. Direct escape-hatch use still bypasses engine budgeting and lifecycle management; managed playback and teardown continue to use official `panic()`/`dispose()` internally without modifying vendor bytes.

### Reusable procedural PBR materials

The root exports `ProceduralMaterial`, the 252-value `ProceduralMaterialKind` (`'wood' | 'brick' | 'stone' | 'metal' | 'fabric' | 'marble' | 'concrete' | 'tiles' | 'leather' | 'sand' | 'rust' | 'snow' | 'asphalt' | 'gravel' | 'cobblestone' | 'bark' | 'moss' | 'mud' | 'granite' | 'slate' | 'terrazzo' | 'denim' | 'burlap' | 'carpet' | 'plaster' | 'terracotta' | 'cork' | 'rubber' | 'carbonfiber' | 'diamondplate' | 'paper' | 'wicker' | 'bamboo' | 'hammeredmetal' | 'galvanized' | 'corrugatedmetal' | 'perforatedmetal' | 'expandedmetal' | 'wiremesh' | 'velvet' | 'terrycloth' | 'boucle' | 'geode' | 'quartz' | 'pyrite' | 'shiplap' | 'glassblock' | 'thatch' | 'charredwood' | 'driftwood' | 'peelingpaint' | 'tiretread' | 'honeycomb' | 'frost' | 'stainedglass' | 'soapstone' | 'butcherblock' | 'wallpaper' | 'embroidery' | 'macrame' | 'brickpaving' | 'steppingstone' | 'woodendeck' | 'cheese' | 'sugarfrosting' | 'candleswax' | 'vinylrecord' | 'graphpaper' | 'notebookpaper' | 'lace' | 'crochet' | 'basketweave' | 'zipper' | 'velcro' | 'button' | 'traintracks' | 'manholecover' | 'speedbump' | 'circuitboard' | 'solarpanel' | 'heattile' | 'pianokeys' | 'drumskin' | 'gongsurface' | 'lensarray' | 'prismtape' | 'fresnel' | 'bandage' | 'pillblister' | 'sutures' | 'trellis' | 'terracottapot' | 'hedgerow' | 'collar' | 'petbed' | 'scratchpost' | 'runningtrack' | 'bouldermat' | 'pooltile' | 'envelope' | 'chalkboard' | 'corkboard' | 'snowdrift' | 'icicle' | 'dewdrops' | 'mooncrater' | 'starfield' | 'nebula' | 'pleats' | 'shoelace' | 'tassel' | 'woksurface' | 'cutlery' | 'choppingboard' | 'faucet' | 'showerhead' | 'bathmat' | 'blinds' | 'curtain' | 'shadecloth' | 'sandstone' | 'travertine' | 'pumice' | 'parquet' | 'mosaic' | 'hexagontiles' | 'knit' | 'corduroy' | 'felt' | 'roofshingles' | 'rooftiles' | 'stucco' | 'lichen' | 'leaflitter' | 'endgrain' | 'acousticfoam' | 'closedcellfoam' | 'linoleum' | 'suede' | 'snakeskin' | 'crocodile' | 'herringbone' | 'tweed' | 'seersucker' | 'knurledmetal' | 'engineturned' | 'goldleaf' | 'orangepeel' | 'coconut' | 'watermelon' | 'limestone' | 'breccia' | 'gneiss' | 'plywood' | 'osb' | 'chipboard' | 'wafflecloth' | 'cableknit' | 'quilting' | 'crackleglaze' | 'flutedceramic' | 'encaustictiles' | 'fishscales' | 'tortoiseshell' | 'feathers' | 'reedmat' | 'rope' | 'straw' | 'studdedrubber' | 'groovedrubber' | 'recycledrubber' | 'breadcrust' | 'wafer' | 'chocolate' | 'pretzel' | 'bagel' | 'croissant' | 'butterflywing' | 'beetlewing' | 'spiderweb' | 'cirrus' | 'cumulus' | 'lightning' | 'kelp' | 'seaweed' | 'anemone' | 'candy' | 'marshmallow' | 'nougat' | 'basketball' | 'tennisball' | 'golfball' | 'boardformedconcrete' | 'ribbedconcrete' | 'splitfaceblock' | 'chainmail' | 'rivetedmetal' | 'weldedmetal' | 'cactus' | 'pinecone' | 'corncob' | 'corrugatedcardboard' | 'creasedpaper' | 'layeredpaper' | 'basalt' | 'scoria' | 'obsidian' | 'malachite' | 'agate' | 'lapislazuli' | 'rice' | 'sesame' | 'coffeebeans' | 'lotusleaf' | 'bananaleaf' | 'fernleaf' | 'braincoral' | 'starcoral' | 'seasponge' | 'houndstooth' | 'tartan' | 'damask' | 'zebrafur' | 'leopardfur' | 'giraffefur' | 'scallopshell' | 'oystershell' | 'nautilusshell' | 'cantaloupe' | 'dragonfruit' | 'kiwiskin' | 'rosepetal' | 'lilypetal' | 'fritillarypetal' | 'birchbark' | 'palmtrunk' | 'sycamorebark' | 'elephanthide' | 'ostrichleather' | 'sharkskin' | 'tactilepaving' | 'roadmarking' | 'draincover' | 'mushroomgills' | 'morel' | 'bracketfungus' | 'pineapple' | 'strawberry' | 'lychee' | 'walnutshell' | 'peanutshell' | 'almondshell'`) and `ProceduralMaterialOptions` (`size?: number; seed?: number`). `await ProceduralMaterial.create(kind, options?)` generates deterministic, seamlessly periodic immutable maps once on the CPU, without external assets or new dependencies. `size` is an integer 32–1024 (default 256); `seed` is an unsigned 32-bit integer 0–4294967295 (default 1). Invalid inputs reject.

Fruit-rind surfaces include pineapple with golden/olive diamond-like polygonal eyes in diagonal staggered rows, narrow brown-green recessed seams and a recessed central eye within a rounded crown; strawberry with red skin, irregularly staggered elongated recessed pockets and small ochre seeds inside them; and lychee with pink/red densely packed irregular polygonal raised tubercles, softened pointed crowns and narrow dark recessed fissures. These are distinct from overlapping pinecone scales, round orange-peel glands and orderly pineapple eyes, respectively. All three are opaque dielectrics with zero metallic B channel and default factor, using the existing seeded deterministic periodic baseColor, normal, metallicRoughness and occlusion maps. Relief is shading/normal mapping only: no geometry, displacement, transparency, subsurface scattering (SSS), transmission or new BRDF. Existing options, physical repeats, caller ownership and borrowed-map lifetimes are unchanged.

Fungal surfaces include mushroomgills with cream/tan densely spaced radial long gills and shorter outer gills around quiet attachment zones; morel with warm ochre/brown irregular elongated recessed chambers and narrow rounded connecting ridges, not regular hexagons or positive coral labyrinths; and bracketfungus with overlapping thin cream/rust/brown fans, broad multitone concentric zones, pale smooth margins and fine velvet-like grain. All three are opaque dielectrics with zero metallic B channel and default factor, using the same four seeded deterministic periodic maps and physical repeats. Relief is surface shading/normal mapping only, without geometry, displacement, alpha, subsurface scattering, transmission, biological growth simulation or a new BRDF; options, caller ownership and borrowed-map lifetimes are unchanged.

Municipal surfaces include tactilepaving with muted safety-yellow cement/ceramic tiles, recessed joints and orderly flat-topped truncated warning domes with rounded shoulders and subordinate fine grain; roadmarking with broad worn off-white painted bands, coherent paint loss exposing dark granular asphalt and slightly raised rounded paint edges smoother than the substrate; and draincover with a rectangular cast-iron frame, parallel elongated rounded-ended slots, raised bars and a crossbrace, cast grain and worn rounded shoulders. Tactilepaving and roadmarking are opaque dielectrics with zero metallic B channel and default factor. Draincover uses default metallic factor 1, metallic B=1 on full frame/bars/crossbrace and B=0 on opaque shaded recess floors and outside, with smooth transitions at rounded shoulders. All use the same four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps and physical repeats; existing options, caller ownership, borrowed-map lifetimes and backend boundaries remain unchanged. Relief is shading/normal-map only: no actual holes, geometry, displacement, alpha or new BRDF. These visual assets do not provide retroreflection, accessibility certification or road-safety compliance.

Animal-skin surfaces include elephanthide with matte grey skin, coarse meandering intersecting recessed wrinkles, rounded shoulders and finer subordinate folds; ostrichleather with warm tan leather, widely spaced irregular recessed quill follicles inside low raised rounded collars and a subordinate fine pebbled background; and sharkskin with dense tiny directional grey-blue denticles tapering downstream, two or three fine lengthwise keels per denticle and shallow overlap shading. These are distinct from generic leather pebbles, almond pores and large rounded fishscales or single-keel snakeskin diamonds. All three are opaque dielectrics with zero metallic B channel and default metallic factor, using the same four CPU-generated seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps and physical repeats. Existing size/seed/contrast/roughnessBias/repeats options, caller ownership, borrowed-map lifetimes and backend boundaries remain unchanged. Relief is surface shading/normal-map only: no geometry, displacement, transparency, transmission, subsurface scattering (SSS) or anisotropic BRDF.

Tree-bark surfaces include birchbark with pale papery bark, short irregular horizontal dark lenticels recessed with occlusion, and shallow papery seams; palmtrunk with dry tan/brown fibers, unevenly spaced transverse leaf scars recessed beneath raised shoulders, and subordinate fine longitudinal fibers; and sycamorebark with broad irregular cream/olive-grey exfoliating patches at several tonal levels and shallow peeling edges. They are distinct from vertical wood grain, bamboo nodes and peeling-paint recolors. All three are opaque dielectrics with zero metallic channel and default factor, using the same four seeded deterministic periodic maps and physical repeats. Relief is shading/normal-map only: no geometry, displacement, alpha, transmission, SSS or new BRDF. Existing options, caller ownership, borrowed-map lifetimes and backend boundaries remain unchanged.

Nutshell surfaces include walnutshell with irregular winding and branching coarse ridges over deeper brown concavities; peanutshell with pale straw/tan reticulation, stronger longitudinal ribs and subordinate cross-links around irregular elongated cells (not woven crossings); and almondshell with a buff surface, scattered elongated recessed pores and subtle directional grain, with negative relief and occlusion rather than pigment-only spots or raised beads. All three are opaque dielectrics with zero metallic B channel and default metallic factor, using the same four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps and physical repeats. These are surface-shading/normal-map effects only, not complete nut geometry, displacement, cutouts, translucency, transmission, subsurface scattering or a new BRDF.

Petal surfaces include rosepetal with wine/red-to-rose soft flowing folds and dense tiny raised papillae, giving a rough velvety microtexture rather than cloth weave, hair or pores; lilypetal with cream/ivory-to-warm yellow fine longitudinal ribs, shallow folds and scattered irregular elongated reddish-brown pigment speckles, with smoother satin roughness than rose and no speckle-shaped holes; and fritillarypetal with purple/cream checker pigmentation alternating across both axes, softly wandering cell margins and fine longitudinal striation, with gentle rib relief independent of the color checks rather than tile grout or woven checks. All three are opaque dielectrics with zero metallic B channel and default metallic factor in both `material` and `createMaterial()`, using only the existing CPU-generated four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps and physical repeat defaults. The preceding 162 kinds must retain byte-identical maps; public size/seed/contrast/roughnessBias/repeats options, caller ownership and borrowed-map lifetimes remain unchanged. Scalar fields must remain C1 at periodic seams and interior support joins. These are surface-shading/normal-map effects only, without flower geometry, alpha, displacement, transmission, subsurface scattering (SSS), simulation or new BRDF capabilities.

Additional fruit skins include cantaloupe with tan raised, irregular interconnected curved netting over subdued green/ochre rind (not hexagonal honeycomb walls or a recolored giraffe pigment network); dragonfruit with saturated rose/magenta waxy skin and staggered tapered bracts transitioning toward yellow-green tips, with shallow lifted tips and underlap shading (not regular triangles or recolored pinecone); and kiwiskin with brown rind, dense fine short hairs in varied directions and small follicle pits (not coarse longitudinal coconut fibers or recolored vertical zebra fur). All three are opaque dielectrics with zero metallic B channel and default factor in both `material` and `createMaterial()`, using only the existing CPU-generated four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps and physical repeat defaults. Caller ownership, borrowed-map lifetimes and public size/seed/contrast/roughnessBias/repeats options remain unchanged. These are surface-shading/normal-map effects only, without alpha, geometry, displacement, actual hair geometry, transmission, subsurface scattering (SSS), simulation or new BRDF capabilities.

Shell-face surfaces include scallopshell with warm cream/pink fan-shaped faces, diverging radial ribs and subtle crossing growth rings (not recolored starcoral); oystershell with rough gray/cream calcified overlapping irregular growth laminae, lifted lips and undercut shading (not regular corrugation or recolored layeredpaper); and nautilusshell with cream/russet coiled faces, curved spiral growth and chamber/stripe subdivisions (not concentric endgrain rings or ordinary dots). These distinct morphologies are opaque dielectrics with zero metallic B channel and default factor in both `material` and `createMaterial()`, using only the existing CPU-generated four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps, physical repeat sampling, caller ownership and unchanged size/seed options. These are stylized shell-face shading/normal-map effects only, not geometry, displacement, transparency, transmission, subsurface scattering, iridescence or animal simulation.

Short-coat surfaces include zebrafur with sinuous, varying-width black/ivory stripes that fork and merge, not uniform sine bands; leopardfur with irregular broken dark rosettes around warmer centers, not solid polka dots or recolored stone; and giraffefur with irregular angular brown patches separated by a connected pale network, not rectangular brick/tile cells. Each combines its distinct pigmentation with fine short directional fiber relief and roughness; pigment boundaries do not form raised armor plates or deep cracks. All three are opaque dielectrics with zero metallic B channel and default factor in both `material` and `createMaterial()`, using only the existing CPU-generated four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps, physical repeat sampling, caller ownership and unchanged size/seed options. These are shallow surface-shading/normal-map effects, not actual fur geometry, alpha, displacement, an anisotropic BRDF or animal simulation.

Patterned textiles include houndstooth with black/ivory broken checks and stepped tooth shapes from woven twill, not an ordinary checkerboard; tartan with warm muted broad and fine crossing bands and visible interlaced yarn crossings, not plain tiles; and damask with paired symmetric floral leaf-and-petal motifs and raised jacquard-like relief on woven backing. Their distinct pattern geometry is not a recolor or rescale of fabric, herringbone, tweed or seersucker. All three are opaque dielectrics with zero metallic B channel and default factor in both `material` and `createMaterial()`, using the existing CPU-generated four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps, physical repeat sampling, caller ownership and unchanged size/seed options. These are surface-shading/normal-map effects only, not real fibers, geometry, alpha, displacement, anisotropy, new BRDF capabilities or cloth simulation.

Marine-skeleton surfaces include braincoral with sinuous labyrinthine rounded ridges and dark intervening valleys; starcoral with distinct corallites whose radial septa surround recessed mouths; and seasponge with an irregular interconnected porous skeleton and channels at multiple scales. These are structurally distinct, not recolors or rescales of scoria, pumice, foam or one another. All three are opaque dielectrics with zero metallic B channel and default factor in both `material` and `createMaterial()`, using the same CPU-generated seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps, physical repeat sampling, caller ownership and size/seed options. Relief is surface shading and normal mapping only, not actual coral or sponge geometry, holes, live polyp geometry, alpha, displacement, subsurface scattering (SSS) or underwater optics/simulation/behavior.

Green-leaf presets include lotusleaf with broad rounded leaves, radial veins and central attachment relief; bananaleaf with elongated broad panels, a strong midrib and closely spaced parallel/oblique side veins; and fernleaf with alternating tapered pinnae along a rachis, each with fine vein relief. These are distinct morphologies, not recolored or rescaled leaflitter. All three are opaque green dielectrics with zero metallic B channel and default factor, using the existing four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps, repeat sampling, caller ownership and size/seed options. Relief is surface shading and normal mapping only, not alpha cutouts, real vegetation geometry, displacement, subsurface scattering, wetness simulation or wind behavior.

Bulk-grain presets include rice with slender ivory kernels, varied orientations and gentle longitudinal relief; sesame with small warm tan asymmetric teardrop seeds, rounded raised keels and tapered tips; and coffeebeans with broader dark roasted-brown oval beans, curved central splits and fine uneven roasting grain. Each has a distinct shape field, not a recolored or rescaled shared pattern. All three are opaque dielectrics with zero metallic B channel and default factor, using the existing four seeded deterministic periodic maps, repeat sampling, caller ownership and size/seed options. These are stylized surface-shading/normal-map textures, not individually simulated grains, physical stacking, geometry, displacement, transparency or subsurface scattering.

The caller owns the returned preset, whose readonly `kind`, `material: PBRMaterial` and `textures` expose four `Texture` sources: `baseColor` (sRGB RGB), `normal` (linear tangent-space), `metallicRoughness` (linear G roughness/B metallic) and `occlusion` (linear R). Defaults are opaque, repeat sampling for all slots, roughness factor 1 and metallic factor 1 for metal, rust, diamondplate, hammeredmetal, galvanized, corrugatedmetal, perforatedmetal, expandedmetal, wiremesh, knurledmetal, engineturned, goldleaf, chainmail, rivetedmetal, weldedmetal and pyrite (0 otherwise, so those maps stay dielectric). Rust's metallic channel varies between remaining metal and corrosion; chainmail's varies between metallic rings and opaque dielectric backing. `createMaterial(options?: Partial<PBRMaterialOptions>)` creates a fresh material borrowing its maps, with caller overrides applied last.

Pavement presets are opaque dielectrics: asphalt has dark granular binder with embedded aggregate, gravel has irregular pebbles and dark recesses, and cobblestone has staggered rounded paving blocks.

Natural-surface presets are also opaque dielectrics using the same four maps: bark has ridges and deep fissures, moss has dense soft green growth, and mud has earthy clumps and shallow cracks.

Stone-finish presets use the same four maps as opaque dielectrics with a zero metallic channel: granite has speckled mineral grains, slate has layered dark stone with fine ridges, and terrazzo has contrasting stone chips in a smooth binder.

Textile presets include denim with diagonal twill, burlap with a coarse cross weave, and carpet with a cut-pile surface. All three use the same four repeating maps as opaque dielectrics with a zero metallic channel, not geometry or hair simulation or transparent weave holes.

Soft textiles include knit with muted stockinette-like repeating V-shaped stitches, rounded raised yarn and recessed loop gaps; corduroy with warm brown parallel rounded raised wales, fine pile speckle and deep narrow valleys; and felt with a muted slate-green matte nonwoven surface, randomly oriented fine fibers and low relief. All three are opaque dielectrics with zero metallic channel and factor, using the same four deterministic periodic maps. Relief is normal-map-only, without yarn/fur geometry or transparent loops.

Building finishes include plaster with pale gypsum, shallow sweeping trowel marks and fine pores; terracotta with unglazed reddish fired clay, irregular kiln mottling and pits, without tile grout; and cork with tan/brown compressed flakes and cellular boundaries. These are opaque dielectrics using the same four repeating maps with a zero metallic channel, not geometry or physical simulation.

Industrial surfaces include rubber with charcoal molded elastomer and fine pebbled stipple, and carbonfiber with dark resin-coated tow bundles and alternating diagonal twill directions. Both are opaque dielectrics with a zero metallic channel. Diamondplate has silver rolled metal with raised alternating diagonal lozenges, metallic channel 1 and default metallic factor 1. All use the same four periodic RGBA maps; relief is normal-map-only, not geometry. Carbon weave does not add a special anisotropic shader, clearcoat or physical simulation.

Craft materials include paper with ivory uncoated pulp fibers, fine irregular grain and subtle formation clouding, not recolored plaster; wicker with broad rounded tan rattan strips interlaced over deep opaque recesses, with fine longitudinal strip grain distinct from coarse burlap; and bamboo with golden longitudinal fibers and periodically staggered darker node bands. All three are opaque dielectrics with zero metallic channel and factor, using the same four periodic maps; relief is normal-map-only, with no geometry, transparent holes, segmented objects or physical simulation.

Formed metals include hammeredmetal with warm copper-like metal, overlapping shallow rounded hammer dimples and smooth continuous relief, not rough rock; galvanized with cool silver zinc spangles, crystallite tonal/roughness contrast and very shallow relief, not gravel; and corrugatedmetal with rolled silver sheet, parallel smooth flutes and faint longitudinal wear. All three use the same four deterministic periodic maps with fully metallic B=255 (1) and default metallic factor 1, unlike mixed-metallic rust. Relief is normal-map-only, without geometry displacement or silhouette changes.

Sandstone has warm wavy sedimentary strata and granular grit, distinct from dark slate and loose sand; travertine has cream limestone with irregular elongated shallow vugs and subtle horizontal mineral banding; pumice has pale gray volcanic rock with dense randomly distributed small rounded vesicles, not recolored gravel or stone. All three are opaque dielectrics with zero metallic channel and factor, using the same four deterministic periodic maps. Pits are normal-map relief, not transparent or geometric holes.

Floor finishes include parquet with basketweave wood blocks made of several narrow slats, alternating longitudinal grain directions and dark recessed seams; mosaic with tiny square glazed tesserae, seeded tile-to-tile tonal variation and narrow recessed grout, distinct from larger tiles; and hexagontiles with six-sided ceramic cells and narrow recessed grout in a seamless periodic tiling. All three are opaque dielectrics with zero metallic channel and factor, using only the same four maps. Relief is normal-map-only; seams do not split geometry.

Exterior finishes include roofshingles with dark mineral-granule asphalt courses, staggered rectangular tabs and overlap shadow bands; rooftiles with terracotta barrel-tile courses, curved crowns, recessed channels and course lap bands; and stucco with warm off-white sprayed/troweled plaster, irregular raised aggregate and pits, coarser than plaster. All three are opaque dielectrics with zero metallic channel and factor, using the same four deterministic periodic maps. Roof overlap and surface relief are conveyed only by shading and normal maps, not geometry, silhouette changes or physical simulation.

Natural detail presets include lichen with irregular shallow crustose colonies, leaflitter with dry oriented leaves, central veins and recessed gaps, and endgrain with curved wood growth rings, pores and radial checks. All three are opaque dielectrics with zero metallic channel and factor, using the same four deterministic periodic maps. Relief is conveyed only by shading and normal maps, not vegetation or wood geometry.

Indoor functional surfaces include acousticfoam with charcoal softened pyramidal foam relief, closedcellfoam with a blue-gray fine closed-cell membrane and shallow dimples, and linoleum with a muted green/teal smooth marbled sheet floor and fine elongated pigment flecks. All three are opaque dielectrics with zero metallic channel and factor, using the same four seeded deterministic periodic maps. Relief is conveyed only by shading and normal maps, without foam geometry, sound absorption or physical simulation.

Leather finishes include suede with tan short brushed nap and fine pores; snakeskin with olive/brown staggered small pointed/rounded diamond scales, central keels and recessed boundaries; and crocodile with dark brown large rounded rectangular scutes and wrinkle creases. All three are opaque dielectrics with zero metallic channel and factor, using the same four seeded deterministic periodic maps. These are synthetic surface patterns with shading/normal-map relief only, not animal geometry or displacement.

Woven finishes include herringbone with alternating diagonal broken-twill chevrons; tweed with coarse mottled yarn, fine flecks and crossing fibers; and seersucker with pale blue/cream alternating flat and puckered bands and a fine weave. All three are opaque dielectrics with zero metallic channel and factor, using the same four seeded deterministic periodic maps. These are surface-shading/normal-map effects only, not cloth geometry, anisotropy or simulation.

Worked metals include knurledmetal with fine crossed diagonal ridges and raised diamond grip; engineturned with overlapping circular silver machining swirls; and goldleaf with warm gold crumple wrinkles and lap seams. All three are opaque and use only the same four seeded deterministic periodic maps, with fully metallic B=255 (1) and default metallic factor 1 in both `material` and `createMaterial()`; explicit caller overrides still apply last. Rust retains its varying metallic map and default factor 1; dielectrics retain default 0. These are surface-shading/normal-map effects only, without actual anisotropy, foil thickness, machining geometry or translucency.

Fruit-surface presets include orangepeel with fine oil-gland dimples and waxy orange skin; coconut with a rough brown husk, fine longitudinal fibers and fissures; and watermelon with green irregular wavy longitudinal rind bands and mottled speckles. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. These are surface-shading/normal-map effects, without fruit geometry, transmission or subsurface scattering.

Geological surfaces include limestone with warm pale rounded carbonate grains in a porous matrix; breccia with angular fractured clasts in cement; and gneiss with folded alternating light/dark mineral bands and crystalline flecks. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without actual rock geometry, displacement or translucency.

Wood composites include plywood with a warm rotary-cut face veneer, cathedral grain and knot eyes, not exposed edge layers; osb with large overlapping elongated oriented wood strands; and chipboard with dense finer randomly oriented wood chips in binder. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without new board geometry or displacement.

Relief textiles include wafflecloth with raised woven waffle rims and recessed square pockets; cableknit with intertwined wool cable braids, crossover relief and smaller flanking knit ribs; and quilting with padded diamond cloth cells and recessed diagonal stitched seams. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without cloth geometry, displacement, transmission or subsurface scattering.

Decorative ceramic and tile finishes include crackleglaze with pale celadon smooth faces and a fine irregular dark recessed crack network; flutedceramic with ivory polished ceramic and vertical rounded flutes; and encaustictiles with cream/muted-blue ornamental cement tiles, floral/geometric pigment inlays and recessed grout. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. These are surface-shading/normal-map effects only, without actual cracks, geometry, displacement, transmission or a new coating system.

Organic coverings include fishscales with blue-gray/teal overlapping staggered rounded scalloped scales, concentric growth marks and exposed lips; tortoiseshell with brown/amber irregular polygon scutes, dark seams, domes and growth rings; and feathers with gray-brown layered pointed vanes, shafts and angled barbs. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. These are surface pigment/normal-map effects only, without geometry, cutout, transmission, iridescence, subsurface scattering or a new shader feature.

Plant-fiber surfaces include reedmat with slender parallel reeds and transverse binding threads; rope with adjacent three-strand twisted rope bands, helical grooves and fine fibers; and straw with golden dry thin scattered straight stems, occasional nodes and layered bedding. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. These are surface-shading/normal-map effects only, without cylinders, geometry, cutout or displacement.

Rubber flooring includes studdedrubber with round flat-topped charcoal studs and beveled shoulders; groovedrubber with broad flat dark-gray ribs and narrow drainage grooves; and recycledrubber with dense fine blue-gray irregular rubber granules in dark binder. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. These are surface-shading/normal-map effects only, not actual friction or drainage physics, geometry or displacement.

Open metalwork include perforatedmetal with a bright metal sheet of staggered round recessed holes and flat web between them; expandedmetal with two diagonal strand families joined at raised nodes around recessed rhombic openings; and wiremesh with plain-woven round wires alternating over and under above dark open gaps. All three are opaque metals with metallic channel and default factor 1, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without sheet geometry, real holes, bent strands, displacement or transmission.

Pile textiles include velvet with dense flat upright pile whose soft crush clouds shift pigment and sheen; terrycloth with staggered rounded loop crowns over the woven ground; and boucle with yarn courses carrying raised annular loop crests around recessed centers above open channels. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without cloth geometry, cut loops, displacement or subsurface scattering.

Crystal surfaces include geode with concentric mineral bands rippling around a fine crystalline druse core; quartz with hexagonal prisms carrying pyramidal apices at varied heights; and pyrite with interlocking stepped cube tops and fine parallel striations. Geode and quartz are opaque dielectrics with zero metallic channel and default factor; pyrite is an opaque metal with metallic channel and default factor 1. All three use only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without crystal geometry, cut facets or displacement.

Building envelopes include shiplap with lap boards shadowed at their overlaps, seeded board tones fading into each seam and grain running along the faces; glassblock with rounded block faces over recessed seams and trapped bubbles domed inside; and thatch with layered straw courses hanging over shadowed laps and fine straws streaking the slope. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without board, block or straw geometry and without displacement.

Weathered surfaces include charredwood with rounded charcoal scales lifted above deep alligator cracks; driftwood with silvered grain ridges split by grain-aligned weathered cracks; and peelingpaint with intact paint faces curled up at their rims over exposed substrate. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without bark, board or paint-chip geometry and without displacement.

Patterned utility surfaces include tiretread with staggered tread blocks stepping above their grooves and fine sipes ribbing each face; honeycomb with hexagonal wax walls cresting around recessed cell floors; and frost with feathery crystal arms radiating from a faded center. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without tread, comb or crystal geometry and without displacement.

Decorative panel surfaces include stainedglass with lead came lifting between irregular panes of different pigment tones; soapstone with soft pale veining sweeping above a dark talc ground; and butcherblock with alternating checker end-grain blocks over recessed joints. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without lead, stone or block geometry and without displacement.

Homeware textiles include wallpaper with a raised damask medallion repeating in exact mirror symmetry on every motif axis; embroidery with raised satin stitches fading at their own support; and macrame with staggered rounded knots stepping above twisted crossing cords. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without thread, stitch or knot geometry and without displacement.

Outdoor hardscapes include brickpaving with running-bond pavers stepping above sandy joints; steppingstone with rounded flagstone pads lifted over gritty ground; and woodendeck with board faces over narrow gaps, domed screw heads and recessed cross slots. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without paver, stone, board or screw geometry and without displacement.

Kitchen and candle surfaces include cheese with smooth rounded eyes of varied sizes sunk below the paste; sugarfrosting with piped rosette peaks swelling over smooth icing; and candleswax with rounded drips whose noses bulge above their runs and the base. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without food or wax geometry and without displacement.

Sound and paper surfaces include vinylrecord with fine concentric grooves rippling around a smooth label disc; graphpaper with major rules sinking deeper than minor rules over the sheet; and notebookpaper with ruled lines, a margin line and punch holes sinking progressively into the page. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without record, paper or punched geometry and without displacement.

Woven craft surfaces include lace with diagonal netting threads crossing above diamond voids; crochet with plush loops raised on half-cell-offset rows over recessed gaps; and basketweave with per-block alternating strips crested by ridges above the gaps between strips. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without thread, yarn or wicker geometry and without displacement.

Fastener surfaces include zipper with offset tooth rows interlocking over a recessed seam beside woven tape; velcro with staggered hook-pin rings above dimpled cores and backing; and button with raised rims above stitched faces and recessed hole pits. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without teeth, pins or button geometry and without displacement.

Road and rail surfaces include traintracks with rails crowning above crosswise sleepers and ballast grain; manholecover with a raised frame ring over a radially and concentrically ribbed panel; and speedbump with rounded crests above their feet and recessed seams under warning stripes. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without rail, cover or bump geometry and without displacement.

Technology surfaces include circuitboard with pads cresting over routed traces above the substrate and recessed via pits; solarpanel with busbars and fine fingers riding raised cell faces out of their gaps; and heattile with rounded tile faces above recessed seams. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without circuitry, cells or tile geometry and without displacement.

Instrument surfaces include pianokeys with black keys rising over white faces split by recessed seams; drumskin with rim lugs crowning the rim above a taut creased membrane; and gongsurface with hammered rings rippling around a raised center boss. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without key, skin or gong geometry and without displacement.

Optical surfaces include lensarray with microlens domes rising out of a fine supporting web; prismtape with diagonal prism ridges cresting over their feet and the tape base; and fresnel with concentric saw rings descending outward around a raised center boss. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without lens, prism or stepped lens geometry and without displacement.

Medical and hygiene surfaces include bandage with a rounded pad cushioning over woven gauze; pillblister with blister domes swelling over scored foil; and sutures with stitch cords bridging the incision above needle pits and bare skin. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without pad, dome, cord or needle geometry and without displacement.

Garden and outdoor surfaces include trellis with crossed slats knotted above the open grid; terracottapot with a proud rim band riding over thrown wall ribs; and hedgerow with leafy clumps swelling over shadowed branch gaps. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without slat, pot or foliage geometry and without displacement.

Pet care surfaces include collar with a buckle rising over stitched webbing and bare backing; petbed with a bolster ring around the dished cushion and base weave; and scratchpost with rope ridges cresting above tight grooves. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without buckle, bolster or rope geometry and without displacement.

Sports ground surfaces include runningtrack with lane lines riding granular rubber above drainage seams; bouldermat with quilted diamonds puffing inside a raised border band; and pooltile with tile faces meeting recessed grout under broad caustic light bands. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without line, quilt or tile geometry and without displacement.

Office and stationery surfaces include envelope with crosshatch ridges framing the recessed flap seam; chalkboard with a frame band surrounding streaked slate above clean passes; and corkboard with granules lifted over the board and deep pin holes. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without flap, frame or pin geometry and without displacement.

Natural phenomena surfaces include snowdrift with wind ripples riding over fine snow grain; icicle with rounded columns hanging over shadowed gaps; and dewdrops with two drop sizes beading over faint leaf veins. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without drift, icicle or droplet geometry and without displacement.

Astronomy surfaces include mooncrater with rims rising over the surface around sunken bowls; starfield with stars and dust points twinkling over the nebula base; and nebula with bright swirl bands flowing around dark dust lanes. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without crater, star or cloud geometry and without displacement.

Garment detail surfaces include pleats with accordion folds cresting over fabric valleys; shoelace with woven cords crossing over the base above punched eyelets; and tassel with strands hanging below the raised binding ring. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without fold, cord or strand geometry and without displacement.

Cookware surfaces include woksurface with hammered dimples over scratched steel under an oil sheen; cutlery with beaded borders framing the brushed handle face; and choppingboard with end-grain blocks holding knife scars above the recessed border. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without dimple, bead or block geometry and without displacement.

Bathroom fixture surfaces include faucet with a polished dome rising over its base plate and scale spots; showerhead with spray holes sinking into the grooved panel face; and bathmat with suction cups doming over the woven backing. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without dome, nozzle or cup geometry and without displacement.

Window shading surfaces include blinds with tilted slat faces rising over the shadowed gaps between them; curtain with draped fold crests over the fabric valleys; and shadecloth with woven threads crossing over the open gaps. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without slat, fold or thread geometry and without displacement.

Food surfaces include breadcrust with cracked toasted bread crust; wafer with fine baked orthogonal pockets and ribs; and chocolate with broad smooth bar squares and recessed score lines. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps with physical repeats. These are flat-surface shading/normal-map effects only, without geometry, displacement, subsurface scattering, transmission, translucency or edible/physics simulation.

Bakery surfaces include pretzel with interlaced dough ropes knotted over the gaps and salt specks; bagel with a chewy ring doming over the recessed hole and sesame specks; and croissant with buttered layer ridges stacked above the browned seams. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without knot, ring or layer geometry and without displacement.

Insect and web surfaces include butterflywing with scale tiles rising above the recessed veins; beetlewing with domed elytra plates over their sutured seams; and spiderweb with radial spokes and concentric silk rings raised over the open cells. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without tile, plate, spoke or ring geometry and without displacement.

Sky and weather surfaces include cirrus with wind-combed streaks feathering across the open high air; cumulus with puffy cauliflower domes piling above the shaded gaps; and lightning with a jagged bolt core glowing above the dark storm sky. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without streak, dome or bolt geometry and without displacement.

Sea life surfaces include kelp with broad slick blades rippling above the shadowed troughs; seaweed with fine branching threads weaving over the shaded gaps; and anemone with ringed tentacles rising around the recessed central mouth. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without blade, thread or tentacle geometry and without displacement.

Candy and sweets surfaces include candy with glossy hard-candy stripes twisting above their shallow seams; marshmallow with soft piped ridges rolling over their rounded grooves and starch dusting; and nougat with nut chunks and bubble pits breaking the chewy sugar base. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps. Relief is a surface-shading/normal-map effect, without stripe, ridge or chunk geometry and without displacement.

Sports-ball surfaces include basketball with orange pebbled leather and recessed dark panel seams; tennisball with yellow-green felt and a pale curved seam; and golfball with a glossy white surface and regular round concave dimples. All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps with physical repeats. These are periodic surface-shading/normal-map approximations, not true spherical panel topology, geometry, displacement, fiber or shell volume, subsurface scattering, transmission or ball physics.

Architectural concrete finishes include boardformedconcrete with gray cast concrete, horizontal timber-board impressions, subtle long grain and recessed board joints (not recolored wood); ribbedconcrete with evenly spaced broad vertical concrete ribs, rounded shoulders, troughs and fine pores; and splitfaceblock with staggered rectangular blocks, rough fractured faces and smooth recessed mortar joints (not recolored brick). All three are opaque dielectrics with zero metallic channel and default factor, using only the same four seeded deterministic periodic maps with physical repeats. These are shading/normal-map effects only, not actual cast geometry, displacement or masonry physics.

Fabricated metals include chainmail with overlapping/interleaved metallic ring relief over dark opaque dielectric backing, not true openings or transparency; rivetedmetal with sheet-panel seams and discrete rounded raised rivets; and weldedmetal with raised periodically scalloped weld beads on flatter metal sheet. All three use only the same four seeded deterministic periodic maps with physical repeats and default metallic factor 1 in both `material` and `createMaterial()`. Chainmail's metallic channel follows ring coverage, with zero on the backing; rivetedmetal and weldedmetal are uniformly metallic (B=255). Relief is shading/normal-map-only, without geometry, displacement or physics; options and caller ownership are unchanged.

Botanical surfaces include cactus with longitudinal green ribs, repeated areoles and fine radial spine impressions; pinecone with staggered overlapping angular woody scales, raised exposed tips and depressed overlap seams, distinct from rounded fishscales; and corncob with tightly arranged plump oblong kernels, rounded crowns and narrow interstices, not recolored brick. All three are opaque dielectrics with zero metallic channel and default factor in both `material` and `createMaterial()`, using only the same four seeded deterministic periodic maps with physical repeats. These are surface-shading/normal-map effects only, not complete plant/fruit topology, geometry, true thorns, displacement or thorn/plant physics; options and caller ownership are unchanged.

Paper packaging surfaces include corrugatedcardboard with exposed rounded paper flutes, ridges and troughs over fibrous kraft (not recolored metal); creasedpaper with intersecting raised fold ridges and recessed fold shoulders over subtle pulp (not merely noise); and layeredpaper with overlapping irregular, torn-edged paper strips, distinct ledges and undercut shading (not recolored paper). All three are opaque dielectrics with zero metallic B channel and default factor in both `material` and `createMaterial()`, using only the same four seeded deterministic periodic baseColor/normal/metallicRoughness/occlusion maps with physical repeats. Flutes, folds and layered edges are surface-shading/normal-map effects only, without geometry, cutaways, displacement, transparent torn silhouettes or tearing physics; public options, caller ownership and borrowed-map lifetimes are unchanged. The preceding 102 outputs, including the original paper, must remain byte-identical.

Volcanic stone surfaces include basalt with dark fine grain, rounded polygonal column-cap relief and recessed joints; scoria with warm dark-red rock, varied compact recessed gas pits and raised rims; and obsidian with very dark glossy opaque volcanic glass and curved conchoidal flake scars. All three are opaque dielectrics with zero metallic B channel and default factor in both `material` and `createMaterial()`, using only the same four seeded deterministic periodic maps with physical repeats. Relief is surface shading/normal maps only, not actual columns, holes, geometry, displacement, transparent glass, refraction or emission.

Decorative mineral surfaces include malachite with rich green nested rounded botryoidal growth bands and subtle polish relief; agate with warm cream/red/orange elongated wavy nested bands, distinct in contour topology and scale; and lapislazuli with deep ultramarine granular stone and pale irregular calcite veins/inclusions, not gold pyrite or metallic flecks. All three are opaque dielectrics with zero metallic B channel and default factor in both `material` and `createMaterial()`, using only the same four seeded deterministic periodic maps, physical repeats and public options. Polish and relief are surface shading/normal maps only, without transparency, refraction, iridescence or gemstone geometry.

Remove all consumers before calling synchronous, idempotent `destroy()`, which releases only generated textures, not override textures or materials. Mesh/Scene do not automatically own the preset. The `destroyed` getter reports state; `createMaterial()` rejects after destruction. Core generation uses assets' existing `Texture.fromImage`; geometry and backend rendering stay unchanged, with no frame-time generation. The [pbr3d gallery](https://github.com/YueyuHoshizora/XYZ.js/tree/main/examples/pbr3d) offers all presets and texture-map previews. Canvas2D remains 2D-only. Actual browser/runtime verification is recorded separately in ACCEPTANCE.

`Lighting2D` adds `emissive`, `specular` and `roughness` to the existing diffuse lighting. Defaults are black, 0 and 1, so older profiles stay diffuse-only. A prepared `Material2D` with `effect()` in both languages runs before lighting; lighting still owns diffuse, specular and emissive. `Occluder2D` is a borrowed segment, at most four per sprite, and blocks matching-space lights with a 2D segment test. It does not model height penumbra. Canvas2D still rejects native 2D lighting.

`PBRMaterialOptions.finish` (`PBRFinishOptions`, read back as frozen `PBRFinish`) adds scalar per-material response on the existing PBR maps: `anisotropy`/`anisotropyRotation`, `iridescence`/`iridescenceIor`/`iridescenceThickness`, `subsurface`/`subsurfaceColor`/`subsurfaceRadius`, `dispersion`, `heightScale`, `wetness`, `snow`, `dirt`, `damage`, `detailStrength`/`layerBlend`, `triplanar` and `lightmapStrength`. Out-of-range values and unknown keys reject. Zero strengths are exact lighting no-ops and add no sampled-texture binding (the mesh uniform grows by 20 floats); the 16-slot texture budget is unchanged. These are bounded shader approximations, not physical simulations: anisotropy modulates roughness by tangent/view alignment (it needs authored tangents), iridescence shifts F0 hue, subsurface adds wrapped diffuse, dispersion splits the transmission background sample into three RGB taps, `heightScale` steps four offset samples of the normal map's Z (a height proxy, not parallax occlusion), wetness/snow/dirt/damage blend color and roughness, `detailStrength` re-samples the base map at scaled UV, and `triplanar` blends the base map along world axes. `lightmap` (with `lightmapSampler`) borrows the emissive sampler: while set, the emissive map is not sampled and the lit color is multiplied by the baked color.

`MaterialAsset.fromImages(maps, overrides?)` decodes ImageBitmap sources into textures it owns, borrows any `Texture` you pass, and builds a `PBRMaterial`; `MaterialAsset.create(options)` borrows everything. `destroy()` is idempotent and releases only decoded textures. A failed decode releases the ones already decoded. `setMeshMaterial(mesh, material)` swaps a mesh's material (validated) without rebuilding it.

The glTF loader and recipe preflight accept `KHR_materials_variants`, anisotropy, iridescence and dispersion (dispersion still requires transmission). `PBRMaterialOptions.opticalMaps` borrows independent anisotropy (RG direction/B strength), iridescence (R factor) and iridescence-thickness (G) maps. These occupy layers 2–4 of the existing optical array, not extra sampler slots; UV0/UV1 transforms and independent wrapping/filtering are retained. Thickness maps interpolate authored minimum/maximum nanometers. `opticalMaterialMaps(material)` exposes the frozen side-table settings without changing published material class shapes. glTF export preserves these maps and ranges. Variant resources remain owned by the loaded asset.

`materialTextureCoordinates(material)` exposes the combined legacy/optical UV
coordinates; the published `MaterialTextureSlot` union and
`material.textureCoordinates` TypeScript declaration remain unchanged for 1.x.

`NativePBRMaterial` is a separate physical-surface hook, not a procedural preset. It extends `PBRMaterial` and requires caller-authored `xyzPhysical` WGSL and GLSL. The engine still owns BRDF, passes and PBR bindings; the hook receives decoded base color, metallic, roughness, occlusion and emission and must not add resources. `isNativeMaterial3D` recognizes both native classes. Prepare physical materials with the optional `renderer.prepareNativePBRMaterial(material)` (the 1.x `prepareMaterial` signature is unchanged); warmup and tracked shadow invalidation include them. Canvas2D rejects them. Borrowed PBR maps stay caller-owned.

## P104–P118 additive profiles in the current source

These approved profiles are integrated in package 1.19.0. Publication does not
certify runtime/browser behavior beyond the recorded scope; actual evidence and
remaining gaps belong in [ACCEPTANCE](../ACCEPTANCE.md). Public names and exact
signatures are in the generated root API.

| Area                            | Contract and boundary                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CommonJS / delivery             | The package has separate CommonJS and ESM consumer entries; CDN metadata remains canonical ESM. The strict package inventory must explicitly cover each reviewed output, including CommonJS artifacts. A package build is not npm publication.                                                                                                                                                    |
| Atlas / distance-field fonts    | The asset producer accepts atlas, bitmap, SDF and MSDF profiles and emits pages plus descriptors consumed by existing loaders. SDF is a single-channel distance field; MSDF uses independently encoded RGB edge distances, not three duplicate SDF channels.                                                                                                                                      |
| Asset watch / scene reload      | `xyz-assets watch` publishes immutable generations and advances `current.json` only on successful builds. Failed builds retain the previous generation; polling and retained generations are bounded. Vite scene reload replaces a Scene only after its candidate succeeds; it does not create another game loop or canvas owner.                                                                 |
| Narrative                       | CutsceneDirector uses Scene simulation time for tracks/cues, seek, pause, cancel, repeat and barriers. Dialogue supports validated branching, conditions, variables and locale data; QuestSystem bounds progress and validates restored state so rewards are not replayed.                                                                                                                        |
| Crowd / physics profiles        | Crowd steering uses reciprocal-avoidance constraints with bounded neighbor work and stable ordering, then submits preferred motion through character sweep. Physics vehicle suspension/tire forces, ragdoll joint/bone blending, soft-body springs/contacts and debug lines are bounded profiles, not general-purpose high-fidelity simulation.                                                   |
| RNG / object pool               | SeededRandom supports reproducible state save/restore/clone and bounded integer/choose/shuffle operations. ObjectPool has fixed capacity and explicit create/reset/destroy callbacks; release ownership, reset failure and terminal destruction are defined.                                                                                                                                      |
| Native 2D lighting              | GPU/GL Sprite normal-map shading supports bounded lights and world/screen lighting. Canvas2D explicitly rejects this feature; combining it with a custom material is unsupported.                                                                                                                                                                                                                 |
| 2D hull / compound colliders    | `convexHull(points, options?)` derives a polygon `Collider2D` from 3–256 input points. `Compound2D` shares one dynamic body across 1–256 convex polygon pieces with derived area/center of mass/inertia; `DynamicConcave2D` decomposes a simple concave polygon into such pieces. Compound CCD rejects; deforming sweeps remain unsupported.                                                      |
| Video texture                   | VideoTexture updates a stable canvas-backed source from decoded frames; VideoTextureDecoder accepts encoded elementary chunks through WebCodecs, and `demuxMP4` / `VideoTextureDecoder.fromMP4` acquire bounded single-video-track MP4 snapshots (avc1/vp09/av01). Fragmented, encrypted, edit-list and multi-description containers reject. Caller controls decoder configuration and ownership. |
| GPU compute                     | ComputeProgram/ComputeBuffer expose bounded WGSL dispatch and typed storage readback on WebGPU. WebGL2 and Canvas2D explicitly report unsupported; buffer contents must be recreated/reuploaded after loss.                                                                                                                                                                                       |
| Render graph / temporal effects | Render graphs validate immutable DAGs and explicit native passes/inputs; descriptors are borrowed. TAA uses jittered history/reprojection and reset conditions; SSR ray-marches depth with environment fallback. Reflection probes capture six scene views and blend bounded environment layers. These are not Canvas features or universal image-quality guarantees.                             |
| Text3D / visibility             | Text3D remains browser-rasterized canvas text, not SDF mesh text. Async updates are latest-wins and preserve the prior result on failure. Existing instance/morph culling is retained; no duplicate culling API is implied.                                                                                                                                                                       |

Arbitrary WebCodecs/container support, arbitrary MSDF font-outline parsing, unbounded simulation,
Canvas shader/compute/3D fallbacks, and cross-browser qualification are not implied.

Live 3D maps are additive overrides: TextureMaterialOptions.textureSource,
PBRMaterialOptions.sources and NativeMaterial3DOptions.textureSources. Existing
immutable Texture options/getters retain their types; a real borrowed fallback
is required for the base map. Renderer upload/cache/shadow tracking uses effective
sources and versions. Remove all consumers before releasing borrowed maps.

No Visual Editor, Visual Scripting, Shader Graph, Networking, native desktop runtime, JavaScript software rasterizer, shader transpiler, full glTF extension set or drop-in three.js/PixiJS/Excalibur parity is promised.

Installed asset projects use the development CLI `xyz-assets preflight --manifest project.json` and `xyz-assets build --manifest project.json --out NEW_DIRECTORY` (`--profile trusted-profile.json` is build-only). The version-1 project manifest's unique-ID entries cover model/map/tileset/atlas/bitmapFont/font/texture/json/text/binary, local relative dependencies and named bundles. Preflight validates bounded immutable snapshots through real parsers/loaders; build publishes a new checksummed deployment, never overwrites inputs, and cancels/cleans owned browser/staging work. Model-only `recipe:true` invokes semantic conversion. External browser/codec development tooling is explicit, not an engine runtime dependency; see the asset recipe link below.

## Task-based acquisition, abort and cleanup

A `PreloadBatch` owns **cancellation**, not generic returned resources. Shared texture/audio cache acquisitions borrow loader-owned resources; cancelling one subscriber does not destroy shared data. A `GLTFLoader.task` is a unique acquisition: unsuccessful/cancelled batch work disposes that task's model. Successful ownership transfers to the consumer, which must dispose the model after removing its users. Custom tasks must implement their own partial-failure cleanup and observe the supplied signal.

This example runs after `game` has been created. Supply a real model URL and an `AbortSignal`; it does not unlock or play audio. Types/classes are imported from the root entry, never private package paths.

```ts
import {
  GLTFLoader,
  PreloadBatch,
  Scene,
  type Game,
  type GLTFAsset,
} from 'xyz.js';

async function showModel(game: Game, url: string, signal: AbortSignal) {
  const batch = new PreloadBatch([new GLTFLoader().task('model', url)]);
  let model: GLTFAsset | undefined;
  const scene = new Scene();
  try {
    model = (await batch.load({ signal })).get('model') as GLTFAsset;
    signal.throwIfAborted();
    scene.add(model.scene);
    await game.setScene(scene, { signal });
    // Successful model ownership belongs to this application.
    return async () => {
      if (game.scene === scene) await game.setScene(new Scene());
      else scene.destroy();
      model?.dispose(); // Consumers are gone before textures are disposed.
    };
  } catch (error) {
    scene.destroy();
    model?.dispose();
    throw error;
  }
}

const pending = new AbortController();
// const releaseModel = await showModel(game, '/models/scene.glb', pending.signal);
// pending.abort() cancels preparation; after success await releaseModel() on teardown.
```

The returned cleanup first removes the Scene's consumers. Abort after a completed batch is not an automatic lifetime manager. Scene preparation failure leaves the prior active Scene intact; use Scene's `preload(game, signal)` barrier when acquiring resources for atomic scene switching. Scene destroys its owned objects, but borrowed textures/material descriptors and loader-owned assets require their respective owner cleanup. Game.destroy tears down its renderer, input, audio and asset loaders; it does not replace disposal of independently acquired GLTF assets.

## Support evidence is a separate contract

Managed Chromium/Firefox/WebKit browser runs establish only their recorded paths. **Managed WebKit is not Safari**, injected touch/gamepad is not physical hardware, `GPUDevice.destroy()` is not uncontrolled driver reset, native signal analysis is not hearing speakers, and RAF/RSS are not presentation completion/VRAM. Physical Safari/mobile/gamepad/IME/audio/assistive-technology/low-tier/driver qualification remains blocked where real fixtures are unavailable; tools must report that explicitly, never substitute emulation.

Configured Windows CI testing does not certify physical Windows hardware or drivers. Browser qualification expands only with actual recorded evidence for the tested browser, host and paths; a configured job or pending CI run is not a passing result.

Windows hosted Chromium uses Microsoft's **WARP CPU rasterizer** through ANGLE D3D11 and Dawn, not a physical GPU. Historical [CI run 37085323026, attempt 1](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37085323026/attempts/1) passed Windows Node22/24/26 quality, 1058 tests, build, API compatibility and negative-smoke, but package creation and browser gates failed. [Run 37092521565](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37092521565) additionally passed all three Windows installed-package/CLI gates, signed native endpoint bootstraps and the complete Firefox job; Chromium WebGL pixels and WebKit pixels/audio still fail. The user-approved official SHA256-pinned, Authenticode-verified [VB-CABLE](https://vb-audio.com/Cable/) bootstrap remains ephemeral-CI-only. The runner's existing Code Integrity flags `0x282203` remain unchanged; this is not test-signing-prohibited environment qualification. Official installer/SYS/Microsoft catalog signatures remain mandatory. Unverified signatures, debugger bypass, changed flags, added TrustedPublisher certificates, unexpected installer exits or missing active default render endpoints fail the gate. No reboot, emulated unlock or driver distribution is allowed. [Upstream donationware licensing](https://vb-audio.com/Services/licensing.htm), including professional-use obligations, applies.

Historical guides and upgrade profiles: [English usage](https://github.com/YueyuHoshizora/XYZ.js/blob/main/docs/USAGE.md), [繁體中文使用說明](https://github.com/YueyuHoshizora/XYZ.js/blob/main/docs/USAGE-zh.md), [English technical reference](https://github.com/YueyuHoshizora/XYZ.js/blob/main/docs/TECHNICAL.md), [繁體中文技術參考](https://github.com/YueyuHoshizora/XYZ.js/blob/main/docs/TECHNICAL-zh.md), [asset recipe](https://github.com/YueyuHoshizora/XYZ.js/blob/main/docs/ASSET-RECIPE.md). These retain historical version strings/counts; this page and the generated root API are the current entry points.

## Performance qualification

Run `node scripts/production-workloads.mjs --calibrate /absolute/new-profile.json --runs 5 --renderer webgl2` against the built engine to collect planned repeated measurements without retries or overwriting an existing profile. Calibration writes **CALIBRATED_NOT_CERTIFIED**; review/pin the host/GPU/backend/quality/workload provenance and bounds, then independently run `node scripts/production-workloads.mjs --profile /absolute/reviewed-profile.json --renderer webgl2`.

The gate separates loading and steady RAF p95/max/hitch fraction (>50ms) from CPU frame/submit p95/max, retaining the mandatory 5000ms teardown bound. A provenance mismatch is BLOCKED/nonzero. `--limit` without a reviewed profile is functional measurement only, not performance qualification; it remains performance BLOCKED/nonzero. Workloads include 2D/3D, dense overlapping physics sensors, concurrent navigation replanning and large visible/invisible mesh populations; Canvas excludes native 3D/visibility workloads. Existing dense sweep and O(N) spatial pose checks are not claimed optimized. An operator-policy hosted profile is not repeated calibration, physical qualification or universal 60FPS certification.

The hosted macOS operator policy pins `expected.presentation: "native-foreground"` and runs with `--presentation native-foreground`. Each workload gets a fresh headed managed Chromium/profile; public `connectOverCDP({noDefaults:true})` attaches only to its default context, preventing Playwright's focus override from being installed. New incognito contexts do not honor this option and are not used. The loopback ephemeral CDP transport argument is explicitly pinned; no scheduling flags, timestamps, workload counts or budgets change. Native spawn/CDP PID agreement and before/after AppKit/normal-window evidence accompany actual DOM focus/visibility observations at every production observer callback and through lifecycle events. Sending `false` on a separate CDP handler cannot remove another handler's focus capture. Missing or interrupted evidence fails while completed measurements remain available. This requires an unlocked foreground-capable desktop and does not prove continuous OS foreground, GPU presentation completion or physical qualification.

The default remains honestly labelled `headless`; native-foreground currently requires macOS. Reviewed profiles must pin `expected.presentation`; unknown/missing or changed modes do not qualify or automatically recalibrate. Same-host/same-binary ABBA isolated a headless-mode effect (≈100ms RAF p95 versus ≈19ms foreground), not an exact App Nap/Viz mechanism. Run 37092521565 passed the five original workload gates but failed the real focus-loss control, so its emulated DOM focus evidence is not qualified. The public no-defaults cutover passes the local real focus-loss control; complete revised hosted qualification remains pending.

The complete five-workload policy and genuine focus-loss guard passed in [run 37105917252](https://github.com/YueyuHoshizora/XYZ.js/actions/runs/37105917252), closing RAF qualification. Windows Chromium still loses its native WebGL context, and WebKit exact pixels still fail despite the attempted `colorSpaceConversion:'none'` policy; that global decode change is removed. The same run proves Windows WebKit exposes neither `AudioContext` nor `AudioWorkletNode`, matching the pinned upstream [ENABLE_WEB_AUDIO OFF](https://github.com/WebKit/WebKit/blob/4d05d732e5a84f32675bef4cc135a2e7a9269a87/Source/cmake/OptionsWin.cmake). The user explicitly approved **UNSUPPORTED** audio only for this native Windows WebKit capability boundary; all graphics/input/lifecycle/cleanup gates remain required, while Chromium/Firefox retain trusted native unlock. This does not certify Windows WebKit audio or weaken signatures, DSP ownership or other gates.

`node scripts/check-production-foreground.mjs` exercises the unchanged 2D workload with a genuine second owned page taking focus and then returning it. It requires the interruption to reject qualification while retaining complete loading/steady native measurements; it neither emulates focus nor supplies a performance profile. CI preserves `.vite/production-focus-guard/` separately from the original all-workload gate. A locked desktop cannot execute this scenario and must not be bypassed.

## Physical qualification workflow

`node scripts/platform-hardware.mjs --inventory /absolute/new-inventory.json` records read-only host facts, not certification. `--prepare physical-gamepad /absolute/new-evidence.json` creates a schema-2 blocked evidence form; `--instructions` lists native scenarios and `--verify /absolute/evidence.json /absolute/review.json` validates artifacts and independent review. Gates cover physical-mobile/gamepad, OS IME/background, BFCache, thermal, physical-audio, spoken-AT and driver recovery. Status is **BLOCKED**, **EVIDENCE-READY-FOR-REVIEW**, or **PHYSICAL-PASS-HUMAN-ATTESTED**, with certification false or explicitly human-attestation-only. Hashes and `isTrusted` cannot prove physical authenticity.

The manual collector serves the built root on loopback by default at `?renderer=canvas2d&physical=1`, without opening a browser or playing sound. External serving requires explicit owned-scope authorization and an existing TLS certificate/key; it does not pair/forward devices. Safari tooling requires authorization for an owned isolated session before starting a driver/browser. Do not use shared/user Safari, modify OS/drivers, or play physical sound. Audible audio and spoken AT remain explicitly BLOCKED under the current no-sound boundary; unavailable owned hardware/operators remain BLOCKED. Exact evidence schemas/scenarios are in [physical qualification procedures](https://github.com/YueyuHoshizora/XYZ.js/blob/main/docs/PHYSICAL-QUALIFICATION.md).

## API compatibility safeguards

`pnpm check:api-compatibility` compares current emitted declarations against the verified published v1.12.1 declaration baseline, retaining the historical v1.11 value/type namespace guard and versioned consumers. The structural checks cover constructors, methods/overloads, generic constraints/defaults, nested options/interfaces, writable members, implementors and protected/abstract subclass obligations. Additive concrete-class members are permitted; private implementation details and structural stand-ins for concrete classes are excluded. `node scripts/check-api-compatibility.mjs --negative-smoke` exercises representative breaking/additive mutations.

This is TypeScript **source** compatibility, not runtime/behavioral, binary or arbitrary historical-version certification. Timing, ownership, cancellation and event behavior require separate regression/actual-consumer evidence. The compatibility report is `.vite/api-compatibility/report.json`; neither generated API pages nor passing declaration checks replace runtime support evidence.

## Package hygiene

After building, run `node scripts/check-package-hygiene.mjs` (optional `--output DIRECTORY`) to compare clean/disposable polluted packs using the same built bytes and pinned pnpm 12.6.0. The reviewed inventory permits exact module outputs, CLI import closures, this source document and 164 vendor entries: all 162 unchanged official OPM.js v1.11.1 dist files, the official LICENSE and the provenance manifest, not generated site/API output. It rejects unknown/missing paths, links, unsafe entry types and invalid archive checksums/end markers, comparing every approved file's bytes/SHA and executable flags.

`--archive /absolute/xyz.js-1.19.0.tgz` checks an actual supplied archive without repacking. The JSON report retains tar hashes, approved file facts and deliberately added cache/development pollution. Extracted-bin help/root math and byte-exact starter creation are consumer smoke, not installed browser gameplay; use the separate starter/browser gate for that. User source/vendor/caches are never removed to make a package pass, and this gate does not build or publish.

## Integrated current-version soak

After building, create the output parent and run `node scripts/mixed-soak.mjs --renderer all --preset smoke --parallel 1 --output .vite/mixed-smoke.json --timeout 400` for a short scenario run (default 30s). Qualification requires the independent hour invocation: `node scripts/mixed-soak.mjs --renderer all --preset hour --parallel 1 --output .vite/mixed-hour.json --timeout 3900`. Hour defaults to 3600 actual active seconds per backend and rejects `--duration` below 3600; active time excludes teardown and completes the in-flight whole cycle. `--parallel 1` runs independent backend browsers concurrently with shared host contention; `--parallel 0` runs sequentially and requires more than three hours overall. The larger smoke watchdog accommodates the measured frame-paced WebGPU recovery, not an optimized recovery claim. There is no extra `--scenario` switch.

The formal Scene cycles combine streamed collision cells, scheduler routes, character goals and GPU/GL dynamic 3D; explicit pause/audio pause, owned IndexedDB SceneSnapshot restoration into a fresh candidate, actual crossfade and same-backend API-loss recovery; then continued gameplay/native PCM and actor render-target pixel proof. Canvas remains actual 2D, with 3D/recovery explicitly unavailable, never emulated. Audio sinks are zero-gain before contexts and Chromium is muted; gesture unlock is still required.

Reports `xyz-mixed-soak-driver-v3` / `xyz-mixed-soak-v3` retain bounded cycle history, leases/scopes/targets/audio/errors/cleanup and separate CDP heap/GC/process trends. Source Git/tree, emitted tree, authored harness and manifest hashes bind the run; optional `--consumer /absolute/extracted/package --packageArchive /absolute/matching.tgz` records the actual consumer/archive. A short smoke, heap trend, tracked-resource cleanup or API-loss recovery is not one-hour success, global no-leak/VRAM proof, physical driver reset or cross-browser certification. Actual duration/version/result evidence belongs in ACCEPTANCE, not inferred from these commands.

## Byte-offset archive loading

`loadAssetBundleRange` opts into a manifest's plain uncompressed archive table:
`archive: { path, bytes, members: [{ path, offset, bytes }] }`. Members match all
tracked descriptor files and retain their SHA-256 checks. Exact 206 ranges are
required; ignored 200 responses become one load-local full snapshot, bounded by
the declared archive size and existing 128 MiB limit. 405/416/501 retry without
Range; malformed responses and integrity failures throw. Forward ResourcePool's
signal to retain cooperative cancellation. Directory bundles and returned model
ownership remain unchanged; no ZIP decoder or persistent archive cache is added.

## Animated image source

`AnimatedImageTexture` decodes GIF/APNG only through WebCodecs ImageDecoder, explicitly
rejecting absent API/unsupported format. Complete compositing/disposal belongs to the
browser codec; owned bounded snapshots close all VideoFrames and the decoder.
Call `updateAnimation(dt)` with simulation seconds; file repetitions or explicit
`plays` control looping, pause freezes and finite playback holds the final frame.
`createAtlas()` supplies an independently owned texture/frames/durations for SpriteSheet;
consumers borrow both sources. See TECHNICAL for budgets, reset and cleanup contracts.
Browser support/qualification is limited to actual evidence recorded in ACCEPTANCE.

## Opt-in frame profiler and native pixel parity

`new Profiler(game.graphics, { enabled: true })` attaches bounded frame collection
without adding a Game/DOM lifecycle owner. `report()` returns a JSON-compatible
snapshot; `format()` returns text. CPU whole-frame and renderer submit time, raw
RAF cadence and asynchronous GPU timestamp samples have separate p50/p95/max
windows. GPU timing must be requested in `Game.create` first. Presentation/GPU
FPS and JS allocation counts remain explicitly unavailable, not inferred from
simulation delta or timestamp durations. Resident texture/geometry/target bytes
are tracked estimates, not total driver VRAM. Disabled collection reads no clock
and allocates no per-frame samples; destroy detaches it.

The Chromium regression includes forced WebGL2/WebGPU deterministic RGB parity
scenes, same-backend repeat noise, and deliberate vertical-flip/wrong-colour
comparator rejection. Actual measured differences and qualification remain in
ACCEPTANCE and `pixel-parity.json`, not implied by the existence of the gate.

## glTF exporter snapshot

`exportGLTF(sceneOrRoots, options?)` asynchronously returns `{json,buffers}`;
`exportGLB(...)` returns GLB 2.0 bytes. Local TRS, triangle streams including
UV0/UV1/tangents/colors, four/eight-influence skins, captured-base morphs, ordinary
PBR extension factors/maps/transforms, explicit material variants, clean supplied
AnimationClips and perspective/orthographic cameras are serialized. Default
embedded PNG encoding requires a browser canvas; external textures require the
caller-provided `textureURI` callback. Unsupported native/live/engine-only data
rejects. Runtime mixers/gameplay/render settings are not baked. See
[technical contract](TECHNICAL.md#gltf-export) for boundaries and ownership;
source CPU/browser tests do not themselves claim executed qualification.

## Native world-nature source

`Terrain3D` builds an XZ heightfield into native LOD chunks with skirts; local
`heightAt()` interpolates the full-resolution triangles, not whichever coarse LOD
is currently visible. `TerrainSplatMaterial` owns its static baked maps while
terrain meshes borrow the material. `Water3D` and `VegetationMaterial` animate
native vertex/physical hooks with explicit simulation time; their CPU geometry,
collision and picking do not follow shader displacement. Water foam is crest-based.
`scatterVegetation` returns seeded instanced batches borrowing geometry/material.
`Trail3D` samples a target's world position into bounded reusable geometry; keep
its root unparented and identity-transformed, and advance monotonic seconds.

The `/examples/world-nature/` page supports forced WebGL2/WebGPU and explicitly
rejects Canvas2D; `?stress=1` selects the local million-vertex/10,000-grass workload.
Native browser assertions and measured evidence are recorded separately below and
in ACCEPTANCE; none of these additions certify other browsers, physical drivers,
presentation throughput or GPU-displaced collision.

Local 2026-10-06 managed Chromium 153/macOS arm64 example runs rendered on forced
WebGL2/WebGPU with empty error/warning consoles; standard/stress screenshots were
read. With a full-resolution million-source-vertex terrain and 10,000 grass
instances, both backends submitted 286 calls/2,212,928 triangles: CPU-submit
p50/p95 was 2.10/3.10 ms (123 samples, GL) and 2.40/2.70 ms (124 samples, GPU),
after 120 warmup frames. These headless single-run values, collected alongside
host quality work, are not isolated calibration, GPU timing or presentation FPS.
Quality/type/API/package gates and the Chromium canvas2d/webgl2/webgpu regression passed after the fixture oracles were corrected (strict thresholds unchanged). See ACCEPTANCE for exact evidence.

## Native post color grading

`setPostEffects(scene.postProcessing, new PostEffectsSettings({ colorGrading }))`
attaches `ColorGradingSettings` with a
`ColorLUT3D` (integer size 16–64). `parseCube` accepts normalized RGB `.cube`
text; non-0–1 domains, 1D directives, malformed/truncated values reject.
`preset` creates identity, warm, cool or cinematic lattices. Both native paths
upload an RGBA8 horizontal blue-slice strip and manually trilinearly sample it
after display encoding; strength is 0–1. Tone operators are none, ACES, AgX-ish
(`agx`, a bounded logarithmic smoothstep approximation, not reference AgX),
Reinhard and peak-preserving neutral. Canvas2D explicitly rejects enabled 3D
postprocessing. WebGL2's existing HDR path requires `EXT_color_buffer_float`;
forced-backend failure throws rather than degrading the effects.
CPU assertions, forced WebGL2/WebGPU single/MSAA renders and strict native parity pass;
see ACCEPTANCE for the tested Chromium scope and integration gates.

## Planar scene reflections

`PlanarReflection({normal, constant, size, updateInterval, clipBias, exclude})`
captures a world-space plane `normal·world + constant = 0`. Call optional
`await renderer.capturePlanarReflection(scene, reflection)` **between frames**
on WebGPU or WebGL2; Canvas2D has no capture hook. Captures render the mirrored
3D scene into a native single-view target with an oblique near plane that
clips geometry on the opposite side (not just hidden reflector meshes).
The source camera may be perspective or orthographic. Scene camera, excluded
visibility, postprocessing, graph and probe state are restored before readback
awaits. Nested captures reject. Resolution is square, integer 2–512 (default
128); update interval is at least 1/120 second (default 0.1), paced by Scene
presentation time, with one pending capture. Calls inside that interval skip.

After the first capture, `reflection.texture` is an owned, versioned
`CanvasTexture2D`: native RGBA8 readback is published as top-left sRGB pixels.
This bounded readback/upload profile is not a zero-copy or HDR reflection.
`reflection.createMaterial({texture: borrowedFallback, ...})` returns an actual
projective `NativeMaterial3D` hook in WGSL and GLSL; prepare it with
`renderer.prepareMaterial` before drawing. Add its reflector mesh to `exclude`
when constructing the capture; native hook uniforms follow successful captures.
`reflection.createPBRMaterial(options, strength = 1)` returns a real
`NativePBRMaterial` physical hook adding projective, sRGB-decoded reflection
radiance to PBR emission on both backends; strength is 0–1. Prepare it with
`renderer.prepareNativePBRMaterial`. The emissive sampler is reserved: existing
emissive maps or lightmaps reject instead of being silently dropped. This is an
additive radiance finish, not roughness-prefiltered planar IBL or Fresnel water
simulation. The ordinary native surface hook remains available for other
surfaces. Remove all consumers
before `reflection.destroy()`; materials and excluded objects are borrowed.
Tunables live in `src/data/rendering.ts`. CPU assertions are added. Targeted
source fixtures on managed Chromium/macOS passed nine assertions per forced
native backend: capture red pixels GL 268/GPU 290, clipped green and excluded
blue both zero; native PBR reflection readback red pixels GL 284/GPU 292.
Screenshots of captured/native readback previews were inspected. The separate
antialias-disabled PBR planar parity scene passed unchanged strict thresholds:
all RGB cross-backend and within-backend repeat mean/p99 errors were exactly 0.
Ordinary capture uses RGBA8 shader display encoding on both backends; GL reserves
HDR capture for material paths requiring it, avoiding unnecessary half-float
quantization. This is not cross-browser, packaged-consumer, broad regression
or physical-device qualification.

## CPU baked lighting

`await bakeLightmap(scene, {meshes, size, padding, atlas, samples, aoDistance,
bias, maxTriangles, maxRays})` snapshots static, undeformed triangle meshes in
world space and builds a bounded median-split triangle BVH. Direct directional,
inverse-square/range point and smooth-cone spot illumination uses visibility
rays; deterministic cosine hemisphere samples occlude ambient light. No GPU
readback or indirect multi-bounce solver is implied. The default atlas generates
disjoint per-triangle UV1 charts without mutating source geometry; use returned
`geometries.get(mesh)` on replacement static meshes. `atlas:'uv1'` instead requires
nondegenerate, nonoverlapping authored UV1 with edge padding. Synchronous dilation
rings fill chart edges for bilinear filtering. Keep mipmapping disabled for this
single-level atlas. The returned `pixels` preserve linear RGB while owned
`texture` is an sRGB RGBA8 Texture (radiance above 1 clamps); merge
`materialOptions` into a PBRMaterial with your borrowed base texture. It selects
the emissive-slot UV1 path and lightmap strength 1. Remove consumers before
`destroy()`; scene and input resources remain borrowed.
Generated bake textures carry an internal identity marker: their irradiance adds
diffuse PBR light even when realtime ambient and direct lights are disabled.
Ordinary authored finish lightmaps retain their existing multiplicative contract.
Disable sources already included in the bake during realtime rendering to avoid
double-counting their contribution; the bake does not mutate scene lights.

`bakeIrradianceVolume(sceneOrEnvironmentMap, {min,max,resolution,order,samples,...})`
creates a world-space `BakedIrradianceVolume`: RGB SH L1 (4 coefficients) or L2
(9), convolved to irradiance/pi. Scene baking includes occluded environment,
direct sun/point/spot projection and one diffuse surface-color bounce; textures
and emissive surfaces are not integrated into that bounce. Environment-only
baking uses bilinear sky radiance. `sampleSH(x,y,z,out)` trilinearly interpolates
to the renderer's 36-float vec4 SH ABI, with false/zero outside bounds or after
destruction. `bindIrradianceVolume(mesh,volume)` opts dynamic PBR meshes into
per-draw sampling at their world origin: normals evaluate the interpolated SH
in native shading, replacing diffuse ambient/IBL, not specular reflections.
This is per-mesh, not per-fragment spatial interpolation; unbind with undefined.

Tunables live in `src/data/rendering.ts`: 1024² texels, 65,536 triangles,
256 lights, 512 samples, 8,000,000 rays, and 4096 probes are hard maxima.
Invalid inputs or exhausted ray quotas reject instead of silently truncating.
CPU assertions are supplied; tests and native/browser integration remain
unverified until the main integration agent runs the checks.

## Immersive WebXR

Use `const xr = new XRSessionManager(game)` from the root entry. Query
`await xr.isSessionSupported('immersive-vr')`, then request an immersive-vr/ar
session from a user gesture with `xr.requestSession(mode, { requiredFeatures,
optionalFeatures })`. Local-floor is required. Canvas2D rejects; WebGL2 requires
makeXRCompatible/XRWebGLLayer; WebGPU requires native XRGPUBinding/layers support.
The session owns frame timing while active, renders each eye with its native view
and projection, and updates Scene.camera3D with the tracked head transform.
Controller grip/target-ray poses are exposed through `xr.controllers`; bind existing
Input actions to `{ virtual: controller.prefix + '.button.0' }` or `.axis.N`
(including binding direction for signed axes). Source removal/hidden/end releases
controls. `await xr.end()` restores normal Game RAF; `xr.destroy()` releases ownership.
Application code must destroy an unused manager. Graphics loss ends its session.
Eye rendering uses native offscreen targets and a framebuffer blit/texture copy,
not direct multiview rendering. No physical headset/runtime was used; actual
immersive rendering and hardware qualification remain BLOCKED (see ACCEPTANCE).

## Native volumetric post fog

`setPostEffects(scene.postProcessing, new PostEffectsSettings({ volumetricFog }))`
attaches `VolumetricFogSettings`, preserving published 1.x setting shapes.
Depth reconstruction integrates an exponential height volume (density,
baseHeight, heightFalloff, maxDistance, linear color) along each camera ray,
then gathers sky-depth visibility toward the projected Scene directional light
for screen-space radial shafts. Fog/shaft samples are integer 1–64; defaults
are 16/32. Back-facing lights disable shafts. This bounded screen-space profile
cannot see offscreen occluders or replace shadow-map volume scattering.
Both native backends share the kernel; enabled postprocessing rejects Canvas2D.
WebGL2 requires float HDR color attachments. Forced native single/MSAA assertions
verify visible fog/shafts and opaque-depth suppression; strict backend parity passes.

## Native lens flare

Attach `new PostEffectsSettings({ lensFlare: new LensFlareSettings(options) })`
with `setPostEffects`. Bright-pass HDR sources generate one to eight bounded
ghost gathers and one halo gather before tone mapping. Strength is 0–4,
threshold is nonnegative, spacing is (0,2], and halo radius/width are normalized
(0,1]. This cheap screen-space lens model excludes hidden/offscreen sources;
it is not an optical simulation. Both native paths use the same bounded kernel;
Canvas2D rejects enabled 3D postprocessing and GL requires float HDR attachments.
Forced native single/MSAA bright-pass assertions and strict backend parity pass.

## Camera motion blur

`PostEffectsSettings.motionBlur` accepts `MotionBlurSettings`: strength 0–2,
integer samples 1–32 (default 12), maximum radius 0–64 backing pixels (default
32). Both native backends reuse TAA's camera/depth reprojection matrices and
history invalidation, without requiring TAA accumulation or jitter. There is
no per-object velocity attachment by default: with `perObject` false,
stationary-camera moving objects are not blurred. `MotionBlurSettings.perObject`
(default false, boolean) adds a renderer-owned rigid per-instance velocity
attachment on both native backends (previous-versus-current world pose, depth
matched, with a validity channel); pixels with valid object velocity gather
along it, while skinned/deforming geometry, missing history and invalid pixels
fall back to the existing camera reprojection. `velocityDepthTolerance`
(default 0.00001) bounds velocity depth matching. Per-object blur adds no new
quality or sample limits; prepare/disable/resize/destroy clean up the velocity
targets and pose history without touching prepared pipelines. Camera/scene changes, cuts, projection changes and viewport changes
invalidate history; static camera velocity is zero. Depth-discontinuous taps
are rejected using the existing relative TAA depth threshold. Motion gathering
precedes fog, flare and tone mapping; it replaces the center's DoF gather on
moving pixels rather than multiplying DoF and motion sample counts.
Canvas2D rejects enabled 3D postprocessing; GL requires float HDR attachments.
CPU/type checks and forced-native single/MSAA pixel assertions passed locally;
integration-wide gates are recorded separately in ACCEPTANCE.

## P135 deterministic material references

`/tests/browser/material-reference.html?renderer=webgl2|webgpu` renders fixed
roughness/metallic, finish, imported glTF sample-like and seeded procedural grids.
`pnpm check:material-reference` compares submitted native RGB pixels across
backends and spatial numeric summaries against the committed JSON golden;
`--regenerate` explicitly replaces that golden after native capture. Both modes
exercise an actual perturbed-material negative control. Browser regression
includes the same gate. These summaries are local rendering regression oracles,
not calibrated physical-material references or arbitrary-driver qualification.

## P136 lifecycle qualification boundary

The native material-lifecycle fixture requires eight real combined resource
create/render/destroy cycles, exact return to warmed texture/geometry/attachment
byte baselines, and actual WebGL context-loss recovery with resources live.
Its tracked native-byte sum is not driver VRAM or pipeline-cache accounting.
Physical-device/headset and cross-browser qualification remain **BLOCKED**;
executed local evidence is recorded separately in ACCEPTANCE.

Local managed Chromium153 native qualification passed eight cycles per backend,
all exact warmed baseline returns and zero unexpected errors; actual GL
loss/recovery was one/one with zero recovered-pixel error. The initial GL packed
probe retention and untracked LUT teardown defects were fixed; counters and
limitations are recorded in the P136 ACCEPTANCE section.
