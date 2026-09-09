<script setup lang="ts">
import type { CardKind } from '../core/types'

defineProps<{ kind: CardKind; variant: 1 | 2 | 3 }>()
</script>

<template>
  <svg class="origami-concept" viewBox="0 0 160 120" aria-hidden="true">
    <g class="figure">
      <template v-if="kind === 'crab'">
        <g v-if="variant === 1">
          <polygon points="42,37 79,29 108,48 99,77 61,86 31,65" class="paper-a" />
          <polygon points="42,37 67,59 31,65" class="paper-b" /><polygon points="67,59 108,48 99,77" class="paper-c" />
          <path d="M34 48L14 33 5 48 25 57M105 51l22-18 10 16-29 16M45 78L29 98M62 84l-4 22M84 82l9 22M99 74l20 21" />
          <path d="M53 35V23M88 33V21" /><circle cx="53" cy="21" r="4"/><circle cx="88" cy="19" r="4"/>
        </g>
        <g v-else-if="variant === 2">
          <polygon points="35,51 67,32 101,48 94,76 55,82 28,68" class="paper-a" />
          <polygon points="35,51 65,59 55,82 28,68" class="paper-b" /><polygon points="65,59 101,48 94,76" class="paper-c" />
          <path d="M31 56L11 47 4 61 27 68M99 55l24-10 8 15-35 10M40 77L19 90l-9-7M58 82L44 101M80 80l13 20M94 75l24 14 9-9" />
          <circle cx="58" cy="47" r="3"/><circle cx="78" cy="45" r="3"/>
        </g>
        <g v-else>
          <polygon points="48,28 82,28 103,53 88,82 42,82 25,53" class="paper-a" />
          <polygon points="48,28 65,57 42,82 25,53" class="paper-b"/><polygon points="65,57 82,28 103,53 88,82" class="paper-c"/>
          <path d="M28 50L9 31 1 53l26 10M101 50l20-20 11 21-30 13M43 80L25 102M58 82l-3 25M75 82l5 25M88 80l19 22" />
          <circle cx="53" cy="43" r="3"/><circle cx="77" cy="43" r="3"/>
        </g>
      </template>

      <template v-else-if="kind === 'shark'">
        <g v-if="variant === 1">
          <polygon points="18,60 50,35 105,40 136,57 105,76 49,82" class="paper-a" />
          <polygon points="49,35 72,58 49,82" class="paper-b"/><polygon points="72,58 105,40 105,76" class="paper-c"/>
          <polygon points="68,37 83,12 93,40" class="paper-d"/><polygon points="20,60 5,39 5,82" class="paper-b"/>
          <circle cx="111" cy="52" r="3"/><path class="detail" d="M112 65l6-5 5 5 6-5"/>
        </g>
        <g v-else-if="variant === 2">
          <path d="M8 86Q39 54 74 58t72 21Q104 97 62 93T8 86Z" class="paper-a"/>
          <polygon points="58,60 83,20 102,68" class="paper-c"/><polygon points="18,82 1,61 5,99" class="paper-b"/>
          <path d="M55 62q22 20 8 31" class="fold"/><circle cx="120" cy="75" r="3"/><path class="detail" d="M121 85l7-4 5 4"/>
          <path class="wake" d="M9 104Q42 95 72 105t72-1"/>
        </g>
        <g v-else>
          <polygon points="22,68 60,28 116,40 139,62 107,85 52,88" class="paper-a"/>
          <polygon points="60,28 77,61 52,88 22,68" class="paper-b"/><polygon points="77,61 116,40 107,85" class="paper-c"/>
          <polygon points="77,35 92,5 105,42" class="paper-d"/><polygon points="24,68 5,43 2,91" class="paper-b"/>
          <polygon points="75,75 95,101 106,79" class="paper-c"/><circle cx="119" cy="56" r="3"/>
        </g>
      </template>

      <template v-else-if="kind === 'swimmer'">
        <g v-if="variant === 1">
          <circle cx="43" cy="34" r="12" class="paper-c"/><polygon points="55,42 87,51 74,72 43,60" class="paper-a"/>
          <polygon points="55,42 61,61 43,60" class="paper-b"/><path d="M82 55l32-15 17 8M46 59L20 74 5 68M72 70l25 20M61 67l-7 30"/>
          <path class="wake" d="M5 106Q38 94 70 105t76-3"/>
        </g>
        <g v-else-if="variant === 2">
          <circle cx="77" cy="21" r="11" class="paper-c"/><polygon points="60,35 91,34 99,62 78,78 49,60" class="paper-a"/>
          <polygon points="60,35 77,56 49,60" class="paper-b"/><path d="M55 44L30 29 16 36M94 44l27-17 14 9M68 74L48 102M87 76l24 25"/>
          <path class="detail" d="M68 17q9-8 18 0"/>
        </g>
        <g v-else>
          <circle cx="47" cy="39" r="11" class="paper-c"/><polygon points="58,48 92,55 83,76 50,68" class="paper-a"/>
          <polygon points="58,48 67,65 50,68" class="paper-b"/><path d="M88 59l35-20M51 66L20 79M80 75l27 22M66 72l-8 29"/>
          <path class="wake" d="M8 93Q31 82 55 91M96 81q21-10 43 0"/>
        </g>
      </template>

      <template v-else-if="kind === 'mermaid'">
        <g v-if="variant === 1">
          <circle cx="62" cy="25" r="11" class="paper-c"/><path d="M51 23Q59 4 76 17l-3 19" class="paper-d"/>
          <polygon points="48,39 77,37 87,64 62,76 38,61" class="paper-a"/><polygon points="62,74 91,92 75,97 63,112 53,78" class="paper-b"/>
          <path d="M42 48L18 64M76 47l24 13"/>
        </g>
        <g v-else-if="variant === 2">
          <circle cx="45" cy="35" r="10" class="paper-c"/><path d="M37 36Q37 16 57 26l-5 18" class="paper-d"/>
          <polygon points="52,43 80,50 75,70 45,62" class="paper-a"/><path d="M76 68Q103 78 115 101L93 94 81 110 66 70Z" class="paper-b"/>
          <path d="M49 59L22 74M74 52l28-10"/><path class="wake" d="M8 95q32-14 59 0"/>
        </g>
        <g v-else>
          <circle cx="69" cy="25" r="10" class="paper-c"/><path d="M57 25Q65 5 83 19l-5 17" class="paper-d"/>
          <polygon points="52,38 82,37 90,62 68,74 43,60" class="paper-a"/><polygon points="68,72 91,99 75,94 61,111 58,76" class="paper-b"/>
          <path d="M48 48L25 62M82 47l24 13"/><circle cx="68" cy="73" r="38" class="halo"/>
        </g>
      </template>

      <template v-else-if="kind === 'shell'">
        <g v-if="variant === 1">
          <path d="M25 91Q28 36 75 21q46 16 49 70Z" class="paper-a"/><polygon points="75,21 75,91 49,37" class="paper-b"/><polygon points="75,21 75,91 101,37" class="paper-c"/>
          <path d="M49 37L56 91M101 37L94 91M25 91h99"/>
        </g>
        <g v-else-if="variant === 2">
          <path d="M31 75Q33 33 72 25q44 4 56 36-10 30-48 40L47 89Z" class="paper-a"/>
          <path d="M72 25q-19 21 5 38t29-8q-2-15-21-14-14 2-10 14" class="fold"/>
          <polygon points="31,75 47,89 20,96" class="paper-b"/>
        </g>
        <g v-else>
          <polygon points="75,17 98,34 118,69 109,94 41,94 31,69 51,34" class="paper-a"/>
          <polygon points="75,17 75,94 51,34" class="paper-b"/><polygon points="75,17 75,94 98,34" class="paper-c"/>
          <path d="M51 34l6 60M98 34l-6 60M31 69l44 25 43-25"/>
        </g>
      </template>

      <template v-else-if="kind === 'octopus'">
        <g v-if="variant === 1">
          <polygon points="48,25 77,15 103,34 101,63 76,76 46,61" class="paper-a"/><polygon points="48,25 73,47 46,61" class="paper-b"/>
          <path d="M49 59Q22 72 31 101M60 70q-18 18-9 38M75 75q-5 19 5 32M90 70q20 17 10 36M100 59q30 12 17 40"/>
          <circle cx="65" cy="42" r="3"/><circle cx="86" cy="42" r="3"/>
        </g>
        <g v-else-if="variant === 2">
          <polygon points="52,31 78,18 103,35 101,61 77,72 50,59" class="paper-a"/><polygon points="52,31 76,48 50,59" class="paper-b"/>
          <path d="M51 58Q16 65 25 91t30-1M62 68q-12 29 8 39M79 72q3 26 19 31M93 66q32 11 22 38"/>
          <circle cx="67" cy="42" r="3"/><circle cx="86" cy="42" r="3"/>
        </g>
        <g v-else>
          <polygon points="51,24 78,14 104,32 104,59 78,74 49,59" class="paper-a"/><polygon points="51,24 76,47 49,59" class="paper-b"/><polygon points="76,47 104,32 104,59 78,74" class="paper-c"/>
          <path d="M52 58Q22 71 31 103M63 69q-15 21-5 40M77 74v35M91 69q17 20 8 39M102 58q30 13 18 45"/>
          <circle cx="66" cy="41" r="3"/><circle cx="88" cy="41" r="3"/>
        </g>
      </template>

      <template v-else-if="kind === 'penguin'">
        <g v-if="variant === 1">
          <polygon points="73,12 99,34 103,75 76,104 45,76 48,34" class="paper-a"/><polygon points="48,34 74,54 45,76" class="paper-b"/><polygon points="74,54 99,34 103,75" class="paper-c"/>
          <polygon points="96,35 122,45 98,54" class="paper-d"/><circle cx="84" cy="30" r="3"/><path d="M66 102l-11 7M85 103l11 7"/>
        </g>
        <g v-else-if="variant === 2">
          <polygon points="42,56 71,30 110,43 124,70 95,89 55,82" class="paper-a"/><polygon points="42,56 76,59 55,82" class="paper-b"/><polygon points="76,59 110,43 124,70 95,89" class="paper-c"/>
          <polygon points="109,44 135,50 116,61" class="paper-d"/><circle cx="101" cy="46" r="3"/><path class="wake" d="M17 95q36-12 66 1"/>
        </g>
        <g v-else>
          <polygon points="72,13 96,33 101,72 75,103 48,74 50,33" class="paper-a"/><polygon points="50,33 74,53 48,74" class="paper-b"/><polygon points="74,53 96,33 101,72" class="paper-c"/>
          <polygon points="94,34 119,44 97,52" class="paper-d"/><path class="detail" d="M59 52q15 14 31 0"/><circle cx="83" cy="29" r="3"/>
        </g>
      </template>

      <template v-else-if="kind === 'sailor'">
        <g v-if="variant === 1">
          <circle cx="76" cy="30" r="14" class="paper-c"/><polygon points="50,47 102,47 116,99 36,99" class="paper-a"/><polygon points="50,47 76,72 102,47 91,86 60,86" class="paper-b"/>
          <path d="M55 19h42L86 7H66Z" class="paper-d"/><path class="detail" d="M66 30h20M76 47v38"/>
        </g>
        <g v-else-if="variant === 2">
          <circle cx="55" cy="35" r="12" class="paper-c"/><polygon points="39,49 71,47 87,82 55,94 29,70" class="paper-a"/>
          <path d="M68 51l30-20 8 7-27 28M34 61L14 80M58 93l-9 16M72 88l20 17"/><path d="M38 26h35L64 16H48Z" class="paper-d"/>
        </g>
        <g v-else>
          <circle cx="75" cy="29" r="13" class="paper-c"/><polygon points="48,44 102,44 116,98 34,98" class="paper-a"/><polygon points="48,44 75,70 102,44 91,84 60,84" class="paper-b"/>
          <path d="M54 18h42L86 7H66Z" class="paper-d"/><path class="detail" d="M53 61h44M75 45v39M64 72h22"/>
        </g>
      </template>

      <template v-else-if="kind === 'lighthouse'">
        <g v-if="variant === 1">
          <polygon points="61,23 91,23 104,103 46,103" class="paper-a"/><polygon points="61,23 76,10 91,23" class="paper-c"/><polygon points="54,62 98,62 101,78 51,78" class="paper-b"/>
          <path d="M58 33L15 19M94 33l43-14"/><path class="detail" d="M64 42h24M61 52h30"/>
        </g>
        <g v-else-if="variant === 2">
          <polygon points="62,36 88,36 99,102 51,102" class="paper-a"/><polygon points="58,29 92,29 98,43 53,43" class="paper-c"/>
          <polygon points="75,36 88,36 99,102 75,102" class="paper-b"/><path d="M57 33L8 15M93 33l57-18"/><path class="wake" d="M16 108q31-12 60 0t67-1"/>
        </g>
        <g v-else>
          <polygon points="61,28 91,28 103,102 47,102" class="paper-a"/><polygon points="61,28 76,13 91,28" class="paper-c"/><polygon points="55,58 97,58 100,75 52,75" class="paper-b"/>
          <path d="M59 35L20 20M93 35l39-15"/><circle cx="76" cy="29" r="34" class="halo"/><path class="detail" d="M64 45h24"/>
        </g>
      </template>

      <template v-else-if="kind === 'shoal'">
        <g v-if="variant === 1">
          <g transform="translate(8 7)"><polygon points="18,45 48,27 82,34 99,51 79,68 47,72" class="paper-a"/><polygon points="19,45 3,29 4,67" class="paper-b"/><circle cx="83" cy="47" r="3"/></g>
          <g transform="translate(55 46) scale(.72)"><polygon points="18,45 48,27 82,34 99,51 79,68 47,72" class="paper-c"/><polygon points="19,45 3,29 4,67" class="paper-b"/><circle cx="83" cy="47" r="3"/></g>
        </g>
        <g v-else-if="variant === 2">
          <g transform="translate(7 2)"><polygon points="18,50 50,30 88,38 104,54 84,72 48,76" class="paper-a"/><polygon points="19,50 2,32 4,72" class="paper-b"/><circle cx="88" cy="51" r="3"/></g>
          <g transform="translate(112 118) rotate(180) scale(.68)"><polygon points="18,50 50,30 88,38 104,54 84,72 48,76" class="paper-c"/><polygon points="19,50 2,32 4,72" class="paper-b"/><circle cx="88" cy="51" r="3"/></g>
          <path class="wake" d="M18 99q51-26 114-2"/>
        </g>
        <g v-else>
          <g transform="translate(8 11)"><polygon points="20,47 49,27 81,34 99,50 79,67 47,72" class="paper-a"/><polygon points="20,47 4,30 5,68" class="paper-b"/><circle cx="83" cy="47" r="3"/></g>
          <g transform="translate(69 54) scale(.62)"><polygon points="20,47 49,27 81,34 99,50 79,67 47,72" class="paper-c"/><polygon points="20,47 4,30 5,68" class="paper-b"/><circle cx="83" cy="47" r="3"/></g>
          <path class="detail" d="M22 26q51-20 103 2M39 91q40 18 80 1"/>
        </g>
      </template>

      <template v-else-if="kind === 'penguin-colony'">
        <g v-if="variant === 1">
          <g transform="translate(18 18) scale(.8)"><polygon points="50,13 74,34 78,76 52,103 24,75 27,34" class="paper-a"/><polygon points="27,34 51,54 24,75" class="paper-b"/><polygon points="72,35 96,45 74,54" class="paper-d"/><circle cx="61" cy="30" r="3"/></g>
          <g transform="translate(70 31) scale(.68)"><polygon points="50,13 74,34 78,76 52,103 24,75 27,34" class="paper-c"/><polygon points="27,34 51,54 24,75" class="paper-b"/><polygon points="72,35 96,45 74,54" class="paper-d"/><circle cx="61" cy="30" r="3"/></g>
        </g>
        <g v-else-if="variant === 2">
          <polygon points="10,91 41,54 73,70 104,46 145,92" class="paper-c"/>
          <g transform="translate(30 14) scale(.72)"><polygon points="50,13 74,34 78,76 52,103 24,75 27,34" class="paper-a"/><polygon points="27,34 51,54 24,75" class="paper-b"/><polygon points="72,35 96,45 74,54" class="paper-d"/><circle cx="61" cy="30" r="3"/></g>
          <g transform="translate(83 30) scale(.57)"><polygon points="50,13 74,34 78,76 52,103 24,75 27,34" class="paper-a"/><polygon points="27,34 51,54 24,75" class="paper-b"/><polygon points="72,35 96,45 74,54" class="paper-d"/><circle cx="61" cy="30" r="3"/></g>
        </g>
        <g v-else>
          <g transform="translate(18 18) scale(.77)"><polygon points="50,13 74,34 78,76 52,103 24,75 27,34" class="paper-a"/><polygon points="27,34 51,54 24,75" class="paper-b"/><polygon points="72,35 96,45 74,54" class="paper-d"/><circle cx="61" cy="30" r="3"/></g>
          <g transform="translate(82 20) scale(.74)"><polygon points="50,13 74,34 78,76 52,103 24,75 27,34" class="paper-c"/><polygon points="27,34 51,54 24,75" class="paper-b"/><polygon points="72,35 96,45 74,54" class="paper-d"/><circle cx="61" cy="30" r="3"/></g>
          <path class="detail" d="M53 85q25 16 51-1"/>
        </g>
      </template>

      <template v-else-if="kind === 'captain'">
        <g v-if="variant === 1">
          <circle cx="76" cy="30" r="14" class="paper-c"/><polygon points="47,48 105,48 120,101 32,101" class="paper-a"/><polygon points="47,48 76,72 105,48 92,87 60,87" class="paper-b"/>
          <path d="M48 19h56L90 4H62Z" class="paper-d"/><path class="detail" d="M68 13h16M76 7v13M65 31h22"/>
        </g>
        <g v-else-if="variant === 2">
          <circle cx="53" cy="33" r="12" class="paper-c"/><polygon points="37,47 69,45 86,82 54,95 27,69" class="paper-a"/>
          <path d="M66 49l34-20 10 8-33 27M31 59L14 77M56 93l-6 16M72 88l21 16"/><path d="M33 25h41L63 12H45Z" class="paper-d"/>
          <path class="detail" d="M47 21h13M53 16v11"/>
        </g>
        <g v-else>
          <circle cx="76" cy="30" r="13" class="paper-c"/><polygon points="49,46 103,46 117,99 35,99" class="paper-a"/><polygon points="49,46 76,70 103,46 91,85 61,85" class="paper-b"/>
          <circle cx="76" cy="78" r="24" class="wheel"/><path class="detail" d="M76 54v48M52 78h48M59 61l34 34M93 61L59 95M54 19h44L87 5H66Z"/>
        </g>
      </template>
    </g>
  </svg>
</template>

<style scoped>
.origami-concept { width:100%; height:100%; overflow:visible; color:rgba(255,255,255,.94); filter:drop-shadow(0 8px 7px rgba(12,39,47,.2)); }
.figure polygon,.figure path,.figure circle { stroke:rgba(255,255,255,.6); stroke-width:1.2; stroke-linejoin:round; }
.figure path:not([class]),.figure .fold,.figure .wake { fill:none; stroke:currentColor; stroke-width:4; stroke-linecap:round; stroke-linejoin:round; }
.figure circle:not([class]) { fill:rgba(11,39,48,.78); stroke:none; }
.paper-a { fill:rgba(255,255,255,.88); }
.paper-b { fill:rgba(255,255,255,.58); }
.paper-c { fill:rgba(255,255,255,.35); }
.paper-d { fill:color-mix(in srgb,currentColor 38%,var(--kind-accent) 62%); }
.detail { fill:none!important; stroke:rgba(27,65,73,.66)!important; stroke-width:2.4!important; stroke-linecap:round; }
.fold { stroke:rgba(255,255,255,.7)!important; stroke-width:2.2!important; }
.wake { stroke:rgba(255,255,255,.62)!important; stroke-width:2.5!important; }
.halo { fill:none!important; stroke:rgba(255,255,255,.3)!important; stroke-width:2!important; stroke-dasharray:4 5; }
.wheel { fill:none!important; stroke:rgba(255,255,255,.74)!important; stroke-width:3!important; }
</style>
