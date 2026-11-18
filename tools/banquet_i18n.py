#!/usr/bin/env python3
"""Source of truth for The Last Banquet's in-game translations.

Edit the table below, then run `python3 tools/banquet_i18n.py` to regenerate
games/banquet/i18n.js (ASCII-escaped, so it carries no raw CJK literals).
`--check` fails if the generated file is stale. Language order: en es de ja ko zh.
Tokens: {n} style parameters; {a.S}/{a.O}/{a.D}/{a.N} = actor subject/object/dative/name
for side a (p = you, d = host), likewise {o.*} and {x.*}.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'games/banquet/i18n.js'
LANGS = ['en', 'es', 'de', 'ja', 'ko', 'zh']
T = {}


def add(key, en, es, de, ja, ko, zh):
    assert key not in T, key
    T[key] = dict(zip(LANGS, (en, es, de, ja, ko, zh)))


# ---- side words: subject / object / dative / bare name ------------------------------------------------
add('who.p.S', 'You', 'Tú', 'Du', 'あなたは', '당신은', '你')
add('who.p.O', 'you', 'a ti', 'dich', 'あなたを', '당신을', '你')
add('who.p.D', 'you', 'a ti', 'dir', 'あなたに', '당신에게', '你')
add('who.p.N', 'You', 'Tú', 'Du', 'あなた', '당신', '你')
add('who.d.S', 'The Host', 'El anfitrión', 'Der Gastgeber', 'ホストは', '호스트는', '莊家')
add('who.d.O', 'the Host', 'al anfitrión', 'den Gastgeber', 'ホストを', '호스트를', '莊家')
add('who.d.D', 'the Host', 'al anfitrión', 'dem Gastgeber', 'ホストに', '호스트에게', '莊家')
add('who.d.N', 'Host', 'Anfitrión', 'Gastgeber', 'ホスト', '호스트', '莊家')
add('sep', ' ', ' ', ' ', '', ' ', '')

# ---- acts, wine types -----------------------------------------------------------------------------------
add('act.1', 'Act I: Probe', 'Acto I: Tanteo', 'Akt I: Abtasten', '第一幕：探り合い', '1막: 탐색', '第一幕：試探')
add('act.2', 'Act II: Gamble', 'Acto II: Apuesta', 'Akt II: Wagnis', '第二幕：駆け引き', '2막: 승부수', '第二幕：博弈')
add('act.3', 'Act III: Death Duel', 'Acto III: Duelo a muerte', 'Akt III: Todesduell', '第三幕：死闘', '3막: 사투', '第三幕：死鬥')
add('act.4', 'Overtime: Sudden Death', 'Prórroga: Muerte súbita', 'Verlängerung: Sudden Death', '延長戦：サドンデス', '연장전: 서든데스', '延長賽：猝死')
add('act.s1', 'Act I', 'Acto I', 'Akt I', '第一幕', '1막', '第一幕')
add('act.s2', 'Act II', 'Acto II', 'Akt II', '第二幕', '2막', '第二幕')
add('act.s3', 'Act III', 'Acto III', 'Akt III', '第三幕', '3막', '第三幕')
add('act.s4', 'Overtime', 'Prórroga', 'Verlängerung', '延長戦', '연장전', '延長賽')
add('act.none', 'The banquet has not started', 'El banquete no ha empezado', 'Das Bankett hat noch nicht begonnen', '晩餐はまだ始まっていない', '만찬이 아직 시작되지 않았다', '晚宴尚未開始')

add('ty.poison', 'Poison', 'Veneno', 'Gift', '猛毒', '맹독', '劇毒')
add('ty.poison2', 'Double Poison', 'Doble veneno', 'Doppelgift', '二重の毒', '이중 독', '雙倍劇毒')
add('ty.nectar', 'Nectar', 'Néctar', 'Nektar', '甘露', '감로', '瓊漿')
add('ty.pnectar', 'Poisoned Nectar', 'Néctar envenenado', 'Vergifteter Nektar', '毒入り甘露', '독 감로', '毒瓊漿')
add('ty.truth', 'Truth Water', 'Agua de la verdad', 'Wahrheitswasser', '真言水', '진언수', '真言水')
add('ty.water', 'Water', 'Agua', 'Wasser', '清水', '맑은 물', '清水')
add('ty.safe', 'Safe', 'Seguro', 'Harmlos', '無毒', '무독', '無毒')
add('ty.danger', 'Dangerous', 'Peligroso', 'Gefährlich', '有毒', '유독', '有毒')

# ---- items ----------------------------------------------------------------------------------------------
add('it.needle.n', 'Silver Needle', 'Aguja de plata', 'Silbernadel', '銀の針', '은침', '銀針')
add('it.needle.d', 'Pick a cup and reveal its wine.', 'Elige una copa y revela su vino.', 'Wähle einen Kelch und decke seinen Wein auf.', '杯を1つ選び、中身を調べる。', '잔 하나를 골라 술의 종류를 확인한다.', '選一杯，查看酒種。')
add('it.scent.n', 'Sniff', 'Olfatear', 'Wittern', '嗅ぎ分け', '향 맡기', '聞香')
add('it.scent.d', 'Pick a cup; count the dangerous wine in it and the next cup.', 'Elige una copa y cuenta el vino peligroso en ella y en la siguiente.', 'Wähle einen Kelch; zähle die gefährlichen Weine in ihm und im nächsten.', '杯を1つ選び、それと次の杯にある危険な酒の数を数える。', '잔 하나를 골라 그 잔과 다음 잔의 위험한 술 수를 센다.', '選一杯，數它和下一杯的危險酒。')
add('it.sober.n', 'Sobering Draught', 'Poción de sobriedad', 'Ernüchterungstrank', '酔い覚まし', '해독약', '醒酒藥')
add('it.sober.d', '+1 HP, Drunk −2; no more items this turn.', '+1 PV, Embriaguez −2; no más objetos este turno.', '+1 LP, Rausch −2; danach keine Gegenstände in diesem Zug.', 'HP+1、酔い−2。以降このターンは道具を使えない。', 'HP +1, 취기 −2. 이번 턴엔 더 이상 도구를 쓸 수 없다.', '回 1 血、酒醉 −2，之後本回合不能再用道具。')
add('it.liquor.n', 'Spiked Liquor', 'Licor adulterado', 'Starker Schnaps', '強い酒', '독주', '烈酒摻雜')
add('it.liquor.d', 'Next cup: poison is fixed at 2, nectar is doubled.', 'Próxima copa: el veneno hace 2 fijos y el néctar se duplica.', 'Nächster Kelch: Gift fix 2, Nektar doppelt.', '次の杯：猛毒は2固定、甘露は倍。', '다음 잔: 맹독은 2 고정, 감로는 2배.', '下一杯：劇毒固定 2 點、瓊漿加倍。')
add('it.change.n', 'Sleight of Hand', 'Cambiazo', 'Taschenspielertrick', 'すり替え', '바꿔치기', '偷天換日')
add('it.change.d', 'Poison → Nectar → Truth Water → Poison.', 'Veneno → néctar → agua de la verdad → veneno.', 'Gift → Nektar → Wahrheitswasser → Gift.', '猛毒→甘露→真言水→猛毒。', '맹독→감로→진언수→맹독.', '劇毒→瓊漿→真言水→劇毒。')
add('it.decree.n', 'Toast Decree', 'Brindis forzado', 'Trinkzwang', '乾杯令', '건배령', '勸酒令')
add('it.decree.d', "The opponent must drink on their next action.", 'El rival debe beber en su próxima acción.', 'Der Gegner muss bei seiner nächsten Aktion selbst trinken.', '相手は次の行動で必ず自分で飲む。', '상대는 다음 행동에서 반드시 직접 마셔야 한다.', '對方下次行動必須自己喝。')
add('it.cheers.n', 'Cheers!', '¡Salud!', 'Prost!', '乾杯！', '건배!', '乾杯！')
add('it.cheers.d', 'You and the opponent each drink the same cup once.', 'Tú y el rival bebéis una vez de la misma copa.', 'Du und der Gegner trinkt je einmal aus demselben Kelch.', '自分と相手が同じ杯をそれぞれ1回ずつ飲む。', '나와 상대가 같은 잔을 한 번씩 마신다.', '你和對方各喝一次同一杯。')
add('it.spin.n', 'Spin the Wheel', 'Girar la ruleta', 'Rad drehen', '回転盤', '룰렛', '轉盤')
add('it.spin.d', 'Reshuffle all cups; all intel is void.', 'Se barajan todas las copas; la información se anula.', 'Alle Kelche werden neu gemischt; alle Infos verfallen.', '全ての杯をシャッフル。得た情報は無効。', '모든 잔을 다시 섞는다. 정보는 무효가 된다.', '全部酒杯重新洗牌，情報作廢。')
add('it.powder.n', 'Concentrated Powder', 'Polvo concentrado', 'Giftpulver', '濃縮毒粉', '농축 독가루', '濃縮毒粉')
add('it.powder.d', 'Poison +1 damage; nectar becomes poisoned nectar.', 'Veneno +1 de daño; el néctar pasa a néctar envenenado.', 'Gift +1 Schaden; Nektar wird zu vergiftetem Nektar.', '猛毒のダメージ+1。甘露は毒入り甘露になる。', '맹독 피해 +1. 감로는 독 감로가 된다.', '劇毒傷害 +1；瓊漿變毒瓊漿。')
add('it.ice.n', 'Diluting Ice', 'Hielo diluyente', 'Verdünnungseis', '希釈氷', '희석 얼음', '稀釋冰塊')
add('it.ice.d', 'Double Poison → Poison; Poison → Water; Poisoned Nectar → Nectar.', 'Doble veneno → veneno; veneno → agua; néctar envenenado → néctar.', 'Doppelgift → Gift; Gift → Wasser; vergifteter Nektar → Nektar.', '二重の毒→猛毒、猛毒→清水、毒入り甘露→甘露。', '이중 독→맹독, 맹독→맑은 물, 독 감로→감로.', '雙倍劇毒−1；劇毒變清水；毒瓊漿變瓊漿。')
add('it.needcup', '(select a cup first)', '(elige una copa antes)', '(erst einen Kelch wählen)', '（先に杯を選ぶ）', '(먼저 잔을 선택)', '（需先選杯）')

# ---- can-use / item messages ----------------------------------------------------------------------------
add('cu.turn', "It's not your turn.", 'No es tu turno.', 'Du bist nicht am Zug.', 'あなたの番ではない。', '당신의 차례가 아니다.', '現在不是你的回合。')
add('cu.now', "You can't use items right now.", 'Ahora no puedes usar objetos.', 'Du kannst jetzt keine Gegenstände benutzen.', '今は道具を使えない。', '지금은 도구를 쓸 수 없다.', '現在不能使用道具。')
add('cu.none', "You don't have that item.", 'No tienes ese objeto.', 'Du besitzt diesen Gegenstand nicht.', 'その道具は持っていない。', '그 도구가 없다.', '沒有這件道具。')
add('cu.lock', 'After a Sobering Draught you cannot use more items this turn.', 'Tras la poción de sobriedad no puedes usar más objetos este turno.', 'Nach dem Ernüchterungstrank sind in diesem Zug keine Gegenstände mehr erlaubt.', '酔い覚ましを使ったので、このターンはもう道具を使えない。', '해독약을 쓴 뒤에는 이번 턴에 도구를 쓸 수 없다.', '用過醒酒藥後，本回合不能再用道具。')
add('cu.once', 'Each item can be used once per turn.', 'Cada objeto se puede usar una vez por turno.', 'Jeder Gegenstand darf pro Zug nur einmal benutzt werden.', '同じ道具は1ターンに1回まで。', '같은 도구는 한 턴에 한 번만 쓸 수 있다.', '同名道具每回合只能用一次。')
add('cu.decreed', 'The opponent is already under a Toast Decree.', 'El rival ya está bajo un brindis forzado.', 'Der Gegner steht bereits unter Trinkzwang.', '相手はすでに乾杯令の対象だ。', '상대는 이미 건배령에 걸려 있다.', '對方已經被勸酒令指定了。')
add('cu.cheers', 'Under a Toast Decree: you must drink it yourself.', 'Bajo un brindis forzado: debes beber tú mismo.', 'Unter Trinkzwang: Du musst selbst trinken.', '乾杯令の対象：自分で飲むしかない。', '건배령에 걸려 직접 마셔야 한다.', '被勸酒令指定，只能自己喝。')
add('cu.nocup', 'There are no cups on the table.', 'No hay copas en la mesa.', 'Es stehen keine Kelche auf dem Tisch.', '卓上に杯がない。', '탁자 위에 잔이 없다.', '桌上沒有酒杯。')
add('it.pick', 'Select a cup first, then use “{item}”.', 'Elige una copa y luego usa «{item}».', 'Wähle zuerst einen Kelch, dann benutze „{item}“.', 'まず杯を選んでから「{item}」を使う。', '먼저 잔을 선택한 뒤 “{item}”을(를) 쓴다.', '請先點選一杯酒，再使用“{item}”。')
add('it.bad', '“{item}” cannot be used on this wine; the item was not spent.', '«{item}» no sirve con este vino; el objeto no se gastó.', '„{item}“ wirkt bei diesem Wein nicht; der Gegenstand wurde nicht verbraucht.', '「{item}」はこの酒には使えない。道具は消費されない。', '“{item}”은(는) 이 술에 쓸 수 없다. 도구는 소모되지 않았다.', '“{item}”不能用在這種酒上，道具沒有消耗。')
add('m.needle', 'The needle shows #{id} is “{type}”{maybe}.', 'La aguja indica que #{id} es «{type}»{maybe}.', 'Die Nadel zeigt: #{id} ist „{type}“{maybe}.', '針は#{id}が「{type}」だと示す{maybe}。', '바늘이 #{id}번이 “{type}”이라고 알려 준다{maybe}.', '銀針顯示 #{id} 是“{type}”{maybe}。')
add('m.maybe', ' (you are drunk: it may be an illusion)', ' (estás ebrio: puede ser una ilusión)', ' (du bist betrunken: vielleicht eine Täuschung)', '（酔っているので幻覚かもしれない）', ' (취해서 환각일 수 있다)', '（酒醉中，可能是幻覺）')

# ---- event log -----------------------------------------------------------------------------------------
add('l.start', '{act} begins. {n} cups on the table; both sides draw items.', 'Comienza {act}. Hay {n} copas en la mesa; ambos roban objetos.', '{act} beginnt. {n} Kelche stehen auf dem Tisch; beide ziehen Gegenstände.', '{act}が始まる。卓上には{n}杯。双方が道具を引く。', '{act} 시작. 탁자 위에 {n}잔이 있고, 양쪽이 도구를 뽑는다.', '{act}開始。桌上還有 {n} 杯酒，雙方各抽道具。')
add('l.needle', '{a.S} used the Silver Needle on #{id}.', '{a.S} usó la aguja de plata en #{id}.', '{a.S} benutzte die Silbernadel an #{id}.', '{a.S}#{id}に銀の針を使った。', '{a.S} #{id}번에 은침을 썼다.', '{a.S}使用銀針，查看了 #{id}。')
add('l.scent', '{a.S} sniffed {ids}.', '{a.S} olfateó {ids}.', '{a.S} witterte an {ids}.', '{a.S}{ids}の匂いを嗅いだ。', '{a.S} {ids}번의 향을 맡았다.', '{a.S}使用聞香，嗅了 {ids}。')
add('l.sober', '{a.S} drank the Sobering Draught: +1 HP, Drunk −2.', '{a.S} bebió la poción de sobriedad: +1 PV, Embriaguez −2.', '{a.S} trank den Ernüchterungstrank: +1 LP, Rausch −2.', '{a.S}酔い覚ましを飲んだ：HP+1、酔い−2。', '{a.S} 해독약을 마셨다: HP +1, 취기 −2.', '{a.S}喝下醒酒藥：回復 1 點生命，酒醉 −2。')
add('l.liquor', '{a.S} used Spiked Liquor: the next cup is intensified.', '{a.S} usó licor adulterado: la próxima copa se intensifica.', '{a.S} benutzte starken Schnaps: Der nächste Kelch wird verstärkt.', '{a.S}強い酒を使った：次の杯の効果が強まる。', '{a.S} 독주를 썼다: 다음 잔의 효과가 강해진다.', '{a.S}使用烈酒摻雜：下一杯的效果加強。')
add('l.decree', '{a.S} used the Toast Decree: {o.S} must drink the next cup themselves.', '{a.S} usó el brindis forzado: {o.S} debe beber la próxima copa por sí mismo.', '{a.S} setzte den Trinkzwang ein: {o.S} muss den nächsten Kelch selbst trinken.', '{a.S}乾杯令を使った。{o.S}次の杯を自分で飲まなければならない。', '{a.S} 건배령을 썼다. {o.S} 다음 잔을 직접 마셔야 한다.', '{a.S}使用勸酒令。下次行動被迫自己喝，對象：{o.N}。')
add('l.spin', '{a.S} spun the wheel: all cups reshuffled, known intel void.', '{a.S} giró la ruleta: se barajan todas las copas y la información se anula.', '{a.S} drehte das Rad: alle Kelche neu gemischt, bekannte Infos verfallen.', '{a.S}回転盤を回した：全ての杯がシャッフルされ、得た情報は無効になった。', '{a.S} 룰렛을 돌렸다: 모든 잔이 다시 섞이고 알던 정보는 무효가 되었다.', '{a.S}轉動轉盤：所有酒杯重新洗牌，已知情報作廢。')
add('l.change', '{a.S} used Sleight of Hand on #{id}.', '{a.S} hizo un cambiazo en #{id}.', '{a.S} wandte den Taschenspielertrick an #{id} an.', '{a.S}#{id}にすり替えを使った。', '{a.S} #{id}번에 바꿔치기를 썼다.', '{a.S}對 #{id} 使用偷天換日。')
add('l.powder', '{a.S} sprinkled Concentrated Powder on #{id}.', '{a.S} espolvoreó polvo concentrado en #{id}.', '{a.S} streute Giftpulver in #{id}.', '{a.S}#{id}に濃縮毒粉を振りかけた。', '{a.S} #{id}번에 농축 독가루를 뿌렸다.', '{a.S}對 #{id} 撒下濃縮毒粉。')
add('l.ice', '{a.S} dropped Diluting Ice into #{id}.', '{a.S} echó hielo diluyente en #{id}.', '{a.S} warf Verdünnungseis in #{id}.', '{a.S}#{id}に希釈氷を落とした。', '{a.S} #{id}번에 희석 얼음을 넣었다.', '{a.S}對 #{id} 丟入稀釋冰塊。')
add('l.cheers', '{a.S} called Cheers!: both drink #{id} once.', '{a.S} gritó «¡Salud!»: ambos beben de #{id} una vez.', '{a.S} rief „Prost!“: Beide trinken je einmal aus #{id}.', '{a.S}乾杯！を宣言：双方が#{id}を1回ずつ飲む。', '{a.S} 건배!를 외쳤다: 양쪽이 #{id}번을 한 번씩 마신다.', '{a.S}發動乾杯！：雙方各喝一次 #{id}。')
add('l.drank', '{a.S} drank #{id}: {type}.', '{a.S} bebió #{id}: {type}.', '{a.S} trank #{id}: {type}.', '{a.S}#{id}を飲んだ：{type}。', '{a.S} #{id}번을 마셨다: {type}.', '{a.S}喝下 #{id}：{type}。')
add('l.lose', '{x.S} lost {n} HP.', '{x.S} perdió {n} PV.', '{x.S} verlor {n} LP.', '{x.S}HPを{n}失った。', '{x.S} HP를 {n} 잃었다.', '{x.S}失去 {n} 點生命。')
add('l.heal', '{a.S} recovered {n} HP.', '{a.S} recuperó {n} PV.', '{a.S} erholte {n} LP.', '{a.S}HPを{n}回復した。', '{a.S} HP를 {n} 회복했다.', '{a.S}回復 {n} 點生命。')
add('l.noheal', 'No healing.', 'Sin curación.', 'Keine Heilung.', '回復なし。', '회복 없음.', '沒有回血。')
add('l.healcap', 'Healing limit for this act reached.', 'Se alcanzó el límite de curación de este acto.', 'Heilungslimit dieses Akts erreicht.', 'この幕の回復上限に達した。', '이번 막의 회복 한도에 도달했다.', '回血次數已達本幕上限。')
add('l.again', '{a.S} may act again.', '{a.S} puede actuar de nuevo.', '{a.S} darf noch einmal handeln.', '{a.S}もう一度行動できる。', '{a.S} 한 번 더 행동할 수 있다.', '{a.S}可以再行動一次。')
add('l.reveal', 'Hand revealed: {a.N}.', 'Mano revelada: {a.N}.', 'Hand aufgedeckt: {a.N}.', '手札が公開された：{a.N}。', '패 공개: {a.N}.', '公開手牌：{a.N}。')
add('l.rand', 'Randomly revealed cup #{id} on the table.', 'Se reveló al azar la copa #{id} de la mesa.', 'Zufällig aufgedeckt: Kelch #{id} auf dem Tisch.', '卓上の#{id}がランダムに公開された。', '탁자 위 #{id}번이 무작위로 공개되었다.', '隨機公開了桌上 #{id}。')
add('l.drunkhurt', 'Being drunk makes poison hurt more.', 'La embriaguez hace que el veneno duela más.', 'Der Rausch lässt das Gift stärker wirken.', '酔いのせいで猛毒がより痛い。', '취기 때문에 맹독이 더 아프다.', '酒醉讓劇毒更痛。')
add('l.faint', '{a.S} passes out and flips the table: Drunk reset, +1 HP, next action skipped, cups reshuffled.', '{a.S} se desploma y vuelca la mesa: Embriaguez a 0, +1 PV, pierde su próxima acción y las copas se barajan.', '{a.S} kippt um und stößt den Tisch um: Rausch zurückgesetzt, +1 LP, nächste Aktion entfällt, Kelche neu gemischt.', '{a.S}酔いつぶれて卓をひっくり返した：酔い0、HP+1、次の行動をスキップ、杯がシャッフルされる。', '{a.S} 취해 쓰러져 탁자를 뒤엎었다: 취기 0, HP +1, 다음 행동 건너뜀, 잔이 다시 섞인다.', '{a.S}醉倒翻桌：酒醉歸零、回復 1 點生命、跳過下一次行動，酒杯重新洗牌。')
add('l.self', '{a.S} chose to drink #{id} themselves.', '{a.S} eligió beber #{id} por sí mismo.', '{a.S} entschied sich, #{id} selbst zu trinken.', '{a.S}#{id}を自分で飲むことにした。', '{a.S} #{id}번을 직접 마시기로 했다.', '{a.S}選擇自己喝 #{id}。')
add('l.offer', '{a.S} offered #{id} straight to {o.D}.', '{a.S} ofreció #{id} directamente {o.D}.', '{a.S} reichte #{id} direkt {o.D}.', '{a.S}#{id}を{o.D}そのまま差し出した。', '{a.S} #{id}번을 {o.D} 그대로 권했다.', '{a.S}把 #{id} 直接敬給{o.N}。')
add('l.claim', '{a.S} covered #{id} with the silver lid, claimed it was nectar, and offered it to {o.D}.', '{a.S} tapó #{id} con la tapa de plata, afirmó que era néctar y se la ofreció {o.D}.', '{a.S} deckte #{id} mit dem Silberdeckel zu, behauptete Nektar und reichte ihn {o.D}.', '{a.S}#{id}に銀の蓋をかぶせ、甘露だと言って{o.D}差し出した。', '{a.S} #{id}번에 은뚜껑을 덮고 감로라고 주장하며 {o.D} 권했다.', '{a.S}把 #{id} 蓋上銀蓋，宣稱是瓊漿，敬給{o.N}。')
add('l.believe', '{a.S} chose to believe and drank #{id}.', '{a.S} decidió creer y bebió #{id}.', '{a.S} glaubte und trank #{id}.', '{a.S}信じて#{id}を飲んだ。', '{a.S} 믿고 #{id}번을 마셨다.', '{a.S}選擇相信，喝下 #{id}。')
add('l.truenectar', 'It really was nectar: both sides Drunk −1.', 'Sí era néctar: ambos bajan 1 de Embriaguez.', 'Es war wirklich Nektar: Beide Seiten Rausch −1.', '本当に甘露だった：双方の酔い−1。', '정말 감로였다: 양쪽 취기 −1.', '那杯真的是瓊漿：雙方酒醉各 −1。')
add('l.liar', '{a.S} was caught lying: Drunk +1 extra.', '{a.S} fue pillado mintiendo: Embriaguez +1 extra.', '{a.S} wurde beim Lügen ertappt: Rausch +1 extra.', '{a.S}嘘が暴かれた：酔いがさらに+1。', '{a.S} 거짓말이 들통났다: 취기 +1 추가.', '{a.S}說謊被揭穿，酒醉額外 +1。')
add('l.doubtok', '{a.S} doubted successfully! #{id} is not nectar; {o.S} must drink it.', '¡{a.S} dudó con éxito! #{id} no es néctar; {o.S} debe beberla.', '{a.S} zweifelte zu Recht! #{id} ist kein Nektar; {o.S} muss ihn trinken.', '{a.S}疑いが的中！#{id}は甘露ではなく、{o.S}自分で飲まされる。', '{a.S} 의심 성공! #{id}번은 감로가 아니며, {o.S} 직접 마셔야 한다.', '{a.S}質疑成功！#{id} 不是瓊漿，{o.S}被迫自己喝下。')
add('l.doubtfail', '{a.S} doubted wrongly: #{id} really was nectar. {a.S} must drink it: no healing, no extra action.', '{a.S} dudó sin razón: #{id} sí era néctar. {a.S} debe beberla: sin curación ni acción extra.', '{a.S} zweifelte zu Unrecht: #{id} war wirklich Nektar. {a.S} muss trinken: keine Heilung, keine Extra-Aktion.', '{a.S}疑いは外れ、#{id}は本当に甘露だった。{a.S}飲まされる：回復なし、追加行動なし。', '{a.S} 의심 실패: #{id}번은 진짜 감로였다. {a.S} 억지로 마셔야 하며 회복도 추가 행동도 없다.', '{a.S}質疑失敗，#{id} 真的是瓊漿。{a.S}被迫喝下，不回血、沒有額外行動。')
add('l.discard', '{a.S} discarded a random item: {item}.', '{a.S} descartó un objeto al azar: {item}.', '{a.S} warf einen zufälligen Gegenstand ab: {item}.', '{a.S}ランダムに道具を捨てた：{item}。', '{a.S} 무작위로 도구를 버렸다: {item}.', '{a.S}隨機棄掉一件道具：{item}。')
add('l.rot', 'The round table turned one seat.', 'La mesa redonda giró un puesto.', 'Der runde Tisch drehte sich um einen Platz.', '円卓が1席分回った。', '원탁이 한 자리 돌았다.', '圓桌旋轉了一個位置。')
add('l.skip', '{a.S} is too drunk and skips this action.', '{a.S} está demasiado ebrio y pierde esta acción.', '{a.S} ist zu betrunken und überspringt diese Aktion.', '{a.S}酔いすぎて今回の行動をスキップした。', '{a.S} 너무 취해 이번 행동을 건너뛴다.', '{a.S}醉得跳過這次行動。')
add('l.pay', 'BONUS +{n} credited: {label}.', 'BONUS +{n} acreditado: {label}.', 'BONUS +{n} gutgeschrieben: {label}.', 'BONUS +{n}ポイント付与：{label}。', 'BONUS +{n}점 지급: {label}.', 'BONUS +{n} 點已入帳：{label}。')
add('pay.a1', 'Survived Act I', 'Sobreviviste al Acto I', 'Akt I überstanden', '第一幕を生き延びた', '1막 생존', '撐過第一幕')
add('pay.a2', 'Survived Act II', 'Sobreviviste al Acto II', 'Akt II überstanden', '第二幕を生き延びた', '2막 생존', '撐過第二幕')
add('pay.a3', 'Survived Act III', 'Sobreviviste al Acto III', 'Akt III überstanden', '第三幕を生き延びた', '3막 생존', '撐過第三幕')
add('pay.win', 'Won the banquet', 'Ganaste el banquete', 'Bankett gewonnen', '晩餐に勝利', '만찬 승리', '贏得這場晚宴')
add('l.cupsout', 'All cups are gone: both sides Drunk −1.', 'Se acabaron las copas: ambos bajan 1 de Embriaguez.', 'Alle Kelche sind leer: Beide Seiten Rausch −1.', '杯がなくなった：双方の酔い−1。', '잔이 모두 비었다: 양쪽 취기 −1.', '酒杯喝完了，雙方酒醉各 −1。')
add('l.tie', 'Act III ended with equal HP! A 3-minute overtime begins.', '¡El Acto III terminó con los mismos PV! Comienza una prórroga de 3 minutos.', 'Akt III endet mit gleichen LP! Es folgt eine 3-minütige Verlängerung.', '第三幕はHP同点！3分間の延長戦に入る。', '3막이 동점으로 끝났다! 3분 연장전이 시작된다.', '第三幕結束，生命相同！進入 3 分鐘延長賽。')
add('l.ot', 'Overtime: a new round of cups.', 'Prórroga: nueva ronda de copas.', 'Verlängerung: neue Kelchrunde.', '延長戦：新しい杯が並ぶ。', '연장전: 새 잔이 놓인다.', '延長賽換下一輪酒杯。')
add('l.otend', 'Overtime is up! Comparing HP.', '¡Se acabó la prórroga! Se comparan los PV.', 'Verlängerung vorbei! Die LP werden verglichen.', '延長戦終了！HPを比べる。', '연장전 종료! HP를 비교한다.', '延長賽時間到！比較生命。')
add('e.win', 'You won the banquet!', '¡Ganaste el banquete!', 'Du hast das Bankett gewonnen!', '晩餐に勝利した！', '만찬에서 승리했다!', '你贏了這場晚宴！')
add('e.lose', 'The Host won the banquet.', 'El anfitrión ganó el banquete.', 'Der Gastgeber hat das Bankett gewonnen.', 'ホストが晩餐に勝利した。', '호스트가 만찬에서 승리했다.', '莊家贏了這場晚宴。')
add('e.draw', 'Equal HP: a draw.', 'Mismos PV: empate.', 'Gleiche LP: Unentschieden.', 'HPが同じ：引き分け。', 'HP가 같다: 무승부.', '生命相同，平手。')
add('l.begin', 'The banquet begins. You act first.', 'Comienza el banquete. Tú actúas primero.', 'Das Bankett beginnt. Du bist zuerst dran.', '晩餐が始まった。あなたが先手。', '만찬이 시작되었다. 당신이 먼저 행동한다.', '晚宴開始。你先行動。')
add('l.quit', 'You forfeited this round.', 'Abandonaste esta partida.', 'Du hast diese Runde aufgegeben.', 'この対戦を放棄した。', '이번 판을 포기했다.', '你放棄了這一局。')
add('h.win', 'You win!', '¡Ganas!', 'Du gewinnst!', 'あなたの勝ち！', '당신의 승리!', '你贏了！')
add('h.quit', 'You forfeited this round.', 'Abandonaste esta partida.', 'Du hast diese Runde aufgegeben.', 'この対戦を放棄した。', '이번 판을 포기했다.', '你放棄了這一局。')
add('h.lose', 'The Host wins.', 'Gana el anfitrión.', 'Der Gastgeber gewinnt.', 'ホストの勝ち。', '호스트의 승리.', '莊家贏了。')
add('h.draw', 'Draw.', 'Empate.', 'Unentschieden.', '引き分け。', '무승부.', '平手。')
add('h.earned', 'BONUS credited this round: {n} pts.', 'BONUS acreditado en esta partida: {n} pts.', 'BONUS in dieser Runde: {n} Pkt.', '今回付与されたBONUS：{n}ポイント。', '이번 판에 지급된 BONUS: {n}점.', '本局共入帳 {n} 點。')
add('h.none', 'No extra achievement reward this round.', 'Sin recompensa extra en esta partida.', 'Diese Runde gab es keine zusätzliche Belohnung.', '今回は追加の達成報酬なし。', '이번 판엔 추가 달성 보상이 없다.', '這一局沒有額外成就獎勵。')

# ---- live UI -------------------------------------------------------------------------------------------
add('u.cup', 'Cup #{id}{info}{claim}', 'Copa #{id}{info}{claim}', 'Kelch #{id}{info}{claim}', '杯 #{id}{info}{claim}', '#{id}번 잔{info}{claim}', '酒杯 #{id}{info}{claim}')
add('u.known', ', intel you hold: {label}', ', información que tienes: {label}', ', deine Info: {label}', '、持っている情報：{label}', ', 가진 정보: {label}', '，你知道的情報：{label}')
add('u.unknown', ', contents unknown', ', contenido desconocido', ', Inhalt unbekannt', '、中身は不明', ', 내용 불명', '，內容未知')
add('u.claimed', ', silver lid claims nectar', ', la tapa de plata afirma néctar', ', Silberdeckel behauptet Nektar', '、銀の蓋は甘露と主張', ', 은뚜껑이 감로라고 주장', '，銀蓋宣稱是瓊漿')
add('u.noitems', 'No items', 'Sin objetos', 'Keine Gegenstände', '道具なし', '도구 없음', '沒有道具')
add('u.dopen', "Host's items (revealed)", 'Objetos del anfitrión (revelados)', 'Gegenstände des Gastgebers (aufgedeckt)', 'ホストの道具（公開済み）', '호스트의 도구 (공개됨)', '莊家的道具（已公開）')
add('u.dhid', "Host's items ({n}, contents unknown)", 'Objetos del anfitrión ({n}, contenido desconocido)', 'Gegenstände des Gastgebers ({n}, Inhalt unbekannt)', 'ホストの道具（{n}個、内容不明）', '호스트의 도구 ({n}개, 내용 불명)', '莊家的道具（{n} 件，內容未知）')
add('u.scentnote', 'Sniff: {ids} — {n} dangerous cups{maybe}.', 'Olfatear: {ids} — {n} copas peligrosas{maybe}.', 'Wittern: {ids} — {n} gefährliche Kelche{maybe}.', '嗅ぎ分け：{ids}に危険な酒が{n}杯{maybe}。', '향 맡기: {ids}번에 위험한 술 {n}잔{maybe}.', '聞香：{ids} 共有 {n} 杯危險酒{maybe}。')
add('u.maybe', ' (may be an illusion)', ' (puede ser una ilusión)', ' (vielleicht eine Täuschung)', '（幻覚かもしれない）', ' (환각일 수 있음)', '（可能是幻覺）')
add('u.seen', 'The Host has seen your hand.', 'El anfitrión ha visto tu mano.', 'Der Gastgeber hat deine Hand gesehen.', 'あなたの手札はホストに見られた。', '호스트가 당신의 패를 보았다.', '你的手牌已被莊家看見。')
add('u.hp', 'HP {a}/{b}', 'PV {a}/{b}', 'LP {a}/{b}', 'HP {a}/{b}', 'HP {a}/{b}', '生命 {a}/{b}')
add('u.dr', 'Drunk {a}/{b}{tip}', 'Embriaguez {a}/{b}{tip}', 'Rausch {a}/{b}{tip}', '酔い {a}/{b}{tip}', '취기 {a}/{b}{tip}', '酒醉 {a}/{b}{tip}')
add('u.tipsy', ' (tipsy)', ' (achispado)', ' (beschwipst)', '（ほろ酔い）', ' (알딸딸)', '（醉意上頭）')
add('u.items', 'Items {n}', 'Objetos {n}', 'Gegenstände {n}', '道具 {n}', '도구 {n}', '道具 {n}')
add('u.comp', 'This act: Poison {a}, Nectar {b}, Truth Water {c} · {n} cups left · Drawn: Poison {x}, Nectar {y}, Truth Water {z}{w}', 'Este acto: veneno {a}, néctar {b}, agua de la verdad {c} · quedan {n} copas · Bebidas: veneno {x}, néctar {y}, agua de la verdad {z}{w}', 'Dieser Akt: Gift {a}, Nektar {b}, Wahrheitswasser {c} · noch {n} Kelche · Getrunken: Gift {x}, Nektar {y}, Wahrheitswasser {z}{w}', 'この幕の内訳：猛毒{a}・甘露{b}・真言水{c} ／ 残り{n}杯 ／ 判明：猛毒{x}・甘露{y}・真言水{z}{w}', '이번 막 구성: 맹독 {a}, 감로 {b}, 진언수 {c} · 남은 잔 {n} · 마신 것: 맹독 {x}, 감로 {y}, 진언수 {z}{w}', '本幕原配：劇毒 {a}、瓊漿 {b}、真言水 {c} · 桌上還有 {n} 杯酒 · 已喝出：劇毒 {x}、瓊漿 {y}、真言水 {z}{w}')
add('u.compwater', ', Water {w}', ', agua {w}', ', Wasser {w}', '・清水{w}', ', 맑은 물 {w}', '、清水 {w}')
add('u.compidle', 'The number of each wine is revealed at the start of every act.', 'Al empezar cada acto se revela cuántas copas hay de cada vino.', 'Zu Beginn jedes Akts wird die Anzahl jeder Weinsorte bekanntgegeben.', '各幕の開始時に、酒の種類ごとの杯数が公開される。', '각 막이 시작될 때 술 종류별 잔 수가 공개된다.', '每幕開始時公開各種酒的杯數。')
add('u.cups', '{n} cups left on the table', 'Quedan {n} copas en la mesa', 'Noch {n} Kelche auf dem Tisch', '卓上に残り{n}杯', '탁자 위에 {n}잔 남음', '桌上還有 {n} 杯酒')
add('u.cwin', 'You win', 'Ganas', 'Du gewinnst', 'あなたの勝ち', '당신의 승리', '你贏了')
add('u.close', 'The Host wins', 'Gana el anfitrión', 'Der Gastgeber gewinnt', 'ホストの勝ち', '호스트의 승리', '莊家贏了')
add('u.cdraw', 'Draw', 'Empate', 'Unentschieden', '引き分け', '무승부', '平手')
add('u.again', 'Press the button for another round', 'Pulsa el botón para otra partida', 'Drücke den Knopf für eine weitere Runde', 'ボタンでもう一戦', '버튼을 눌러 한 판 더', '再按按鈕來一場')
add('u.press', 'Press Start', 'Pulsa Empezar', 'Drücke Start', 'スタートを押す', '시작 버튼을 누르기', '按下開始')
add('u.yourturn', 'Your turn', 'Tu turno', 'Du bist dran', 'あなたの番', '당신의 차례', '輪到你')
add('u.hostturn', "The Host's turn", 'Turno del anfitrión', 'Der Gastgeber ist dran', 'ホストの番', '호스트의 차례', '輪到莊家')
add('u.over', 'This round is over.', 'La partida terminó.', 'Diese Runde ist vorbei.', 'この対戦は終了した。', '이번 판이 끝났다.', '這一場結束了。')
add('u.pressgo', 'Press “Start Banquet”.', 'Pulsa «Empezar banquete».', 'Drücke „Bankett starten“.', '「晩餐を始める」を押す。', '“만찬 시작”을 누르자.', '按「開始晚宴」')
add('u.pending', 'The Host covered a cup with the silver lid. Your call.', 'El anfitrión tapó una copa con la tapa de plata. Decide tú.', 'Der Gastgeber hat einen Kelch mit dem Silberdeckel abgedeckt. Du entscheidest.', 'ホストが杯に銀の蓋をかぶせた。あなたが決める番だ。', '호스트가 잔에 은뚜껑을 덮었다. 당신이 결정할 차례다.', '莊家蓋上了銀蓋，等你決定。')
add('u.think', 'The Host is thinking…', 'El anfitrión está pensando…', 'Der Gastgeber überlegt…', 'ホストが考えている…', '호스트가 생각 중…', '莊家思考中…')
add('u.decreed', 'Toast Decree on you: this time you must drink it yourself.', 'Brindis forzado sobre ti: esta vez debes beber tú mismo.', 'Trinkzwang gegen dich: Diesmal musst du selbst trinken.', '乾杯令の対象：今回は自分で飲むしかない。', '건배령에 걸렸다: 이번엔 직접 마셔야 한다.', '你被勸酒令指定：這次只能自己喝。')
add('u.selected', 'Selected #{id}: decide what to do with this cup.', 'Elegida #{id}: decide qué hacer con esta copa.', '#{id} gewählt: Entscheide, was mit diesem Kelch geschieht.', '#{id}を選択：この杯をどうするか決めよう。', '#{id}번 선택: 이 잔을 어떻게 할지 정하자.', '已選 #{id}：決定怎麼處理這杯酒。')
add('u.selfirst', 'Select a cup first, then decide what to do with it.', 'Elige primero una copa y luego decide qué hacer con ella.', 'Wähle zuerst einen Kelch und entscheide dann, was damit geschieht.', 'まず杯を選び、それをどうするか決めよう。', '먼저 잔을 선택한 뒤 어떻게 할지 정하자.', '先點選一杯酒，再決定怎麼處理它。')
add('u.advon', 'Advanced mode: Silver-Lid Bluff (on)', 'Modo avanzado: farol con tapa de plata (sí)', 'Fortgeschritten: Silberdeckel-Bluff (an)', '上級モード：銀の蓋ブラフ（オン）', '고급 모드: 은뚜껑 블러프 (켜짐)', '進階模式：銀蓋吹牛（開）')
add('u.advoff', 'Advanced mode: Silver-Lid Bluff (off)', 'Modo avanzado: farol con tapa de plata (no)', 'Fortgeschritten: Silberdeckel-Bluff (aus)', '上級モード：銀の蓋ブラフ（オフ）', '고급 모드: 은뚜껑 블러프 (꺼짐)', '進階模式：銀蓋吹牛（關）')
add('u.soundon', 'Sound: on', 'Sonido: sí', 'Ton: an', '音：オン', '소리: 켜짐', '音效：開')
add('u.soundoff', 'Sound: off', 'Sonido: no', 'Ton: aus', '音：オフ', '소리: 꺼짐', '音效：關')
add('u.claimq', 'The Host claims #{id} is nectar. Believe and drink, or doubt?', 'El anfitrión afirma que #{id} es néctar. ¿Crees y bebes, o dudas?', 'Der Gastgeber behauptet, #{id} sei Nektar. Glauben und trinken oder zweifeln?', 'ホストは#{id}が甘露だと言っている。信じて飲む？それとも疑う？', '호스트는 #{id}번이 감로라고 한다. 믿고 마실까, 의심할까?', '莊家宣稱 #{id} 是瓊漿。你要相信並喝下，還是質疑？')
add('u.going', 'Banquet in progress', 'Banquete en curso', 'Bankett läuft', '晩餐の最中', '만찬 진행 중', '晚宴進行中')
add('u.goagain', 'Another banquet', 'Otro banquete', 'Noch ein Bankett', 'もう一度晩餐を', '한 번 더', '再辦一場')
add('u.go', 'Start Banquet', 'Empezar banquete', 'Bankett starten', '晩餐を始める', '만찬 시작', '開始晚宴')
add('u.quitarm', 'Press again to confirm', 'Pulsa de nuevo para confirmar', 'Zum Bestätigen erneut drücken', 'もう一度押して確定', '한 번 더 눌러 확인', '再按一次確認放棄')
add('u.quit', 'Forfeit round', 'Abandonar partida', 'Runde aufgeben', '対戦を放棄', '판 포기', '放棄本局')
add('u.notstarted', 'Not started', 'Sin empezar', 'Nicht gestartet', '未開始', '시작 전', '未開始')
add('u.pts', '{n} pts', '{n} pts', '{n} Pkt.', '{n}ポイント', '{n}점', '{n} 點')
add('u.wins', '{n} wins', '{n} victorias', '{n} Siege', '{n}勝', '{n}승', '{n} 場')
add('u.pickfirst', 'Select a cup first.', 'Elige una copa primero.', 'Wähle zuerst einen Kelch.', 'まず杯を選ぼう。', '먼저 잔을 선택하자.', '請先點選一杯酒。')
add('u.startadv', 'The banquet begins! Select a cup, then drink it, offer it to the Host, or cover it with the silver lid to bluff.', '¡Empieza el banquete! Elige una copa y bébela, ofrécesela al anfitrión o tápala con la tapa de plata para farolear.', 'Das Bankett beginnt! Wähle einen Kelch: trinke ihn, reiche ihn dem Gastgeber oder bluffe mit dem Silberdeckel.', '晩餐が始まる！杯を選び、自分で飲む・ホストに差し出す・銀の蓋でブラフ、のどれかを選ぼう。', '만찬이 시작되었다! 잔을 선택해 직접 마시거나, 호스트에게 권하거나, 은뚜껑으로 속이자.', '晚宴開始！先點選一杯酒，再決定自己喝、敬給莊家，或蓋上銀蓋騙他。')
add('u.start', 'The banquet begins! Select a cup, then drink it or offer it to the Host.', '¡Empieza el banquete! Elige una copa y bébela u ofrécesela al anfitrión.', 'Das Bankett beginnt! Wähle einen Kelch: trinke ihn oder reiche ihn dem Gastgeber.', '晩餐が始まる！杯を選び、自分で飲むかホストに差し出そう。', '만찬이 시작되었다! 잔을 선택해 직접 마시거나 호스트에게 권하자.', '晚宴開始！先點選一杯酒，再決定自己喝或敬給莊家。')
add('u.bonusmsg', 'BONUS +{n} credited: {label}.', 'BONUS +{n} acreditado: {label}.', 'BONUS +{n} gutgeschrieben: {label}.', 'BONUS +{n}ポイント付与：{label}。', 'BONUS +{n}점 지급: {label}.', 'BONUS +{n} 點已入帳：{label}。')

# ---- static view text (applied through data-bq attributes) ----------------------------------------------
add('v.host', 'Host', 'Anfitrión', 'Gastgeber', 'ホスト', '호스트', '莊家')
add('v.you', 'You', 'Tú', 'Du', 'あなた', '당신', '你')
add('v.self', 'Drink it myself', 'Beberla yo', 'Selbst trinken', '自分で飲む', '직접 마신다', '自己喝下')
add('v.toast', 'Offer it to the Host', 'Ofrecérsela al anfitrión', 'Dem Gastgeber reichen', 'ホストに差し出す', '호스트에게 권한다', '直接敬給莊家')
add('v.silver', 'Silver lid: claim nectar', 'Tapa de plata: afirmar néctar', 'Silberdeckel: Nektar behaupten', '銀の蓋：甘露と主張', '은뚜껑: 감로라고 주장', '銀蓋宣稱是瓊漿')
add('v.believe', 'Believe and drink', 'Creer y beber', 'Glauben und trinken', '信じて飲む', '믿고 마신다', '相信並喝下')
add('v.doubt', 'Doubt', 'Dudar', 'Zweifeln', '疑う', '의심한다', '質疑')
add('v.table', 'Cups on the round table; pick one', 'Copas en la mesa redonda; elige una', 'Kelche auf dem runden Tisch; wähle einen', '円卓の上の杯。1つ選ぶ', '원탁 위의 잔. 하나를 고른다', '圓桌上的酒杯，點選一杯')
add('v.myitems', 'Your items', 'Tus objetos', 'Deine Gegenstände', 'あなたの道具', '당신의 도구', '你的道具')
add('v.log', 'Event log (newest first)', 'Registro de eventos (lo más nuevo primero)', 'Ereignisprotokoll (neueste zuerst)', 'イベント記録（新しい順）', '이벤트 기록 (최신순)', '事件紀錄（最新在上）')
add('v.panel', 'The Last Banquet controls', 'Controles de El último banquete', 'Steuerung von Das letzte Bankett', '最後の晩餐の操作', '마지막 만찬 조작', '最後的晚餐操作')
add('v.progress', 'Progress', 'Progreso', 'Fortschritt', '進行', '진행', '目前進度')
add('v.bonus', 'This round BONUS', 'BONUS de la partida', 'BONUS dieser Runde', '今回のBONUS', '이번 판 BONUS', '本局 BONUS')
add('v.winsl', 'Wins', 'Victorias', 'Siege', '勝利数', '승수', '勝場')
add('v.msg', 'The Host has taken his seat. Press Start, select a cup, then drink it or offer it to the Host.', 'El anfitrión ya está sentado. Pulsa Empezar, elige una copa y bébela u ofrécesela.', 'Der Gastgeber hat Platz genommen. Drücke Start, wähle einen Kelch und trinke ihn oder reiche ihn dem Gastgeber.', 'ホストは席に着いた。スタートを押し、杯を選んで自分で飲むかホストに差し出そう。', '호스트가 자리에 앉았다. 시작을 누르고 잔을 골라 직접 마시거나 호스트에게 권하자.', '莊家已經入席。開始後先選一杯酒，再決定自己喝或敬給莊家。')
add('v.hint', 'Select a cup on the table first (or press its number key), then use an action. Items that need a cup are not spent if none is selected. Poison costs HP; nectar heals and gives another action; truth water reveals a hand. From Drunk 3, intel can be an illusion.', 'Elige primero una copa de la mesa (o pulsa su número) y luego una acción. Los objetos que piden copa no se gastan si no hay ninguna elegida. El veneno quita PV; el néctar cura y da otra acción; el agua de la verdad revela una mano. Con Embriaguez 3 o más, la información puede ser ilusoria.', 'Wähle zuerst einen Kelch auf dem Tisch (oder drücke seine Zifferntaste), dann eine Aktion. Gegenstände, die einen Kelch brauchen, werden ohne Auswahl nicht verbraucht. Gift kostet LP; Nektar heilt und gibt eine weitere Aktion; Wahrheitswasser deckt eine Hand auf. Ab Rausch 3 können Infos Täuschungen sein.', 'まずテーブルの杯を選び（数字キーでも可）、次に行動する。杯が必要な道具は、未選択なら消費されない。猛毒はHPを減らし、甘露は回復して再行動、真言水は手札を公開する。酔い3以上では情報が幻覚のことがある。', '먼저 탁자의 잔을 선택하고(숫자 키도 가능) 행동한다. 잔이 필요한 도구는 선택하지 않으면 소모되지 않는다. 맹독은 HP를 깎고, 감로는 회복 후 재행동, 진언수는 패를 공개한다. 취기 3 이상이면 정보가 환각일 수 있다.', '先點選圓桌上的酒杯（或按數字鍵），再按下方行動。道具要選杯時，沒選杯不會消耗。劇毒會扣血，瓊漿回血並再行動，真言水會公開手牌。酒醉 3 以上時情報可能是幻覺。')
add('v.rulesT', 'How to play and BONUS', 'Cómo jugar y BONUS', 'Spielregeln und BONUS', '遊び方とポイント', '규칙과 점수', '玩法與點數')
add('v.r1', 'The base game has no silver-lid bluffing: only drinking, offering and items. Turn on “Advanced mode” to add silver-lid claims and doubts; every silver-lid rule below applies to advanced mode only.', 'El modo básico no tiene farol con tapa de plata: solo beber, ofrecer y objetos. Activa el «Modo avanzado» para añadir afirmaciones y dudas con la tapa; las reglas de la tapa de plata de abajo solo valen en el modo avanzado.', 'Das Grundspiel hat keinen Silberdeckel-Bluff: nur Trinken, Reichen und Gegenstände. Mit dem „Fortgeschrittenen Modus“ kommen Behauptungen und Zweifel hinzu; alle Silberdeckel-Regeln unten gelten nur dort.', '基本版に銀の蓋ブラフはなく、自分で飲む・差し出す・道具だけ。「上級モード」をオンにすると銀の蓋の宣言と疑いが加わる。以下の銀の蓋のルールは上級モード専用。', '기본 모드에는 은뚜껑 블러프가 없고, 직접 마시기·권하기·도구만 있다. “고급 모드”를 켜면 은뚜껑 주장과 의심이 추가되며, 아래 은뚜껑 규칙은 모두 고급 모드에서만 적용된다.', '基礎版沒有銀蓋吹牛，只有自己喝、直接敬酒與道具；打開「進階模式」才會出現銀蓋宣稱與質疑，下面提到銀蓋的規則都只適用於進階模式。')
add('v.r2', 'You and the Host each have 5 HP and take turns dealing with the mysterious cups on the table. At the start of each act the number of each wine is revealed, but not which cup is which: Act I has 4 cups (Poison 2, Nectar 1, Truth Water 1), Act II has 6 (Poison 3, Nectar 2, Truth Water 1), Act III has 8 (Poison 4, Nectar 2, Truth Water 2). Each act both sides draw items (2, 3, 4); you can hold at most 4, and unused items carry over.', 'Tú y el anfitrión tenéis 5 PV y os turnáis para tratar con las copas misteriosas de la mesa. Al empezar cada acto se revela cuántas hay de cada vino, pero no cuál es cuál: Acto I, 4 copas (veneno 2, néctar 1, agua de la verdad 1); Acto II, 6 (veneno 3, néctar 2, agua de la verdad 1); Acto III, 8 (veneno 4, néctar 2, agua de la verdad 2). En cada acto ambos roban objetos (2, 3, 4); el máximo es 4 y los no usados pasan al siguiente acto.', 'Du und der Gastgeber habt je 5 LP und kümmert euch abwechselnd um die rätselhaften Kelche. Zu Beginn jedes Akts wird die Anzahl jeder Sorte bekanntgegeben, aber nicht, welcher Kelch welcher ist: Akt I hat 4 Kelche (Gift 2, Nektar 1, Wahrheitswasser 1), Akt II 6 (Gift 3, Nektar 2, Wahrheitswasser 1), Akt III 8 (Gift 4, Nektar 2, Wahrheitswasser 2). In jedem Akt ziehen beide Gegenstände (2, 3, 4); maximal 4 Stück, ungenutzte bleiben erhalten.', 'あなたとホストはHP5で、交互に卓上の正体不明の杯を扱う。各幕の開始時に酒の種類ごとの杯数は公開されるが、どれが何かは分からない：第一幕は4杯（猛毒2・甘露1・真言水1）、第二幕は6杯（猛毒3・甘露2・真言水1）、第三幕は8杯（猛毒4・甘露2・真言水2）。各幕で双方が道具を引く（2・3・4個）。所持は最大4個、使わなかった道具は次の幕に持ち越す。', '당신과 호스트는 HP 5로 번갈아 탁자 위의 정체불명의 잔을 다룬다. 각 막이 시작될 때 술 종류별 잔 수는 공개되지만 어느 잔이 무엇인지는 알 수 없다: 1막 4잔(맹독 2, 감로 1, 진언수 1), 2막 6잔(맹독 3, 감로 2, 진언수 1), 3막 8잔(맹독 4, 감로 2, 진언수 2). 각 막마다 양쪽이 도구를 뽑는다(2, 3, 4개). 최대 4개까지 보유하며 안 쓴 도구는 다음 막으로 넘어간다.', '你和莊家各有 5 點生命，輪流處理桌上來路不明的酒杯。每幕開始時公開各種酒的杯數，但不公開哪一杯是哪種：第一幕 4 杯（劇毒 2、瓊漿 1、真言水 1），第二幕 6 杯（劇毒 3、瓊漿 2、真言水 1），第三幕 8 杯（劇毒 4、瓊漿 2、真言水 2）。每幕雙方各抽道具（2、3、4 件），道具最多持有 4 件，沒用完的會留到下一幕。')
add('v.r3', 'On your turn you may use items first, then pick a cup: drink it yourself, or offer it straight to the Host (he must drink, and you keep the turn unless he drinks nectar), or cover it with the silver lid and claim it is nectar. The Host can believe and drink, or doubt. A successful doubt makes the liar drink it with +1 Drunk and passes the turn to the doubter; a failed doubt (it really was plain nectar) forces the doubter to drink with no healing and no extra action, discard a random item, and the turn returns to the one who offered. After every silver-lid action the table turns one seat; cup numbers and contents move with the cups.', 'En tu turno puedes usar objetos y luego elegir una copa: beberla tú, ofrecérsela directamente al anfitrión (debe beber y conservas el turno salvo que beba néctar) o taparla con la tapa de plata afirmando que es néctar. El anfitrión puede creer y beber, o dudar. Si la duda acierta, el mentiroso bebe con +1 de Embriaguez y el turno pasa a quien dudó; si falla (era néctar de verdad), quien dudó bebe sin curarse ni acción extra, descarta un objeto al azar y el turno vuelve a quien ofreció. Tras cada acción con tapa la mesa gira un puesto; los números y contenidos se mueven con las copas.', 'Du darfst zuerst Gegenstände benutzen und dann einen Kelch wählen: selbst trinken, dem Gastgeber direkt reichen (er muss trinken; du behältst den Zug, außer er trinkt Nektar) oder mit dem Silberdeckel abdecken und Nektar behaupten. Der Gastgeber kann glauben und trinken oder zweifeln. Berechtigter Zweifel: Der Lügner trinkt mit +1 Rausch, der Zug geht an den Zweifler; unberechtigter Zweifel (es war echter Nektar): Der Zweifler trinkt ohne Heilung und Extra-Aktion, wirft einen zufälligen Gegenstand ab, und der Zug geht zurück an den Anbietenden. Nach jeder Silberdeckel-Aktion dreht sich der Tisch um einen Platz; Nummern und Inhalte wandern mit den Kelchen.', 'あなたの番では、まず道具を使い、次に杯を1つ選ぶ：自分で飲む、ホストにそのまま差し出す（ホストは必ず飲み、甘露を飲まない限り手番はあなたのまま）、または銀の蓋をかぶせて甘露だと宣言する。ホストは信じて飲むか、疑うか選ぶ。疑いが当たれば、嘘をついた側が酔い+1で飲み、手番は疑った側へ。外れた（本当に普通の甘露だった）場合、疑った側は回復も追加行動もなしで飲まされ、道具をランダムに1つ捨て、手番は差し出した側に戻る。銀の蓋の行動のたびに円卓が1席回り、杯の番号と中身は杯と一緒に動く。', '당신의 차례에는 먼저 도구를 쓴 뒤 잔을 하나 고른다: 직접 마시거나, 호스트에게 그대로 권하거나(호스트는 반드시 마시며, 감로를 마시지 않는 한 차례는 당신이 유지), 은뚜껑을 덮고 감로라고 주장한다. 호스트는 믿고 마시거나 의심할 수 있다. 의심이 맞으면 거짓말한 쪽이 취기 +1로 마시고 차례는 의심한 쪽으로 넘어간다. 틀리면(정말 평범한 감로) 의심한 쪽이 회복도 추가 행동도 없이 억지로 마시고 도구를 무작위로 하나 버리며, 차례는 권한 쪽으로 돌아간다. 은뚜껑 행동 뒤에는 원탁이 한 자리 돌고, 잔의 번호와 내용은 잔을 따라 이동한다.', '輪到你時可以先用道具，再選一杯：自己喝下、直接敬給莊家（他一定要喝，你保有回合，除非他喝到瓊漿），或蓋上銀蓋宣稱那杯是瓊漿。莊家可以相信並喝下，或質疑。質疑成功，說謊的人自己喝下並多醉 1，回合交給質疑的人；質疑失敗（那杯真的是普通瓊漿），質疑的人被迫喝下、不回血、不能再行動，還要隨機棄掉一件道具，回合交回敬酒的人。每次銀蓋行動後，圓桌會轉一個位置，杯子的編號和內容跟著杯子走。')
add('v.r4', 'Poison costs the drinker 1 HP; nectar restores 1 HP and gives another action (each side can heal at most twice per act); truth water reveals all of the drinker’s items, or a random table cup if they have none. Each cup drunk adds 1 Drunk. At Drunk 3–4, the Silver Needle and Sniff show wrong intel half the time, and poison costs 1 extra HP. At Drunk 5 you pass out and flip the table: Drunk resets, +1 HP, your next action is skipped, all cups are reshuffled and all known intel is void. At the end of each act both sides lose 1 Drunk.', 'El veneno quita 1 PV a quien bebe; el néctar cura 1 PV y da otra acción (cada bando se cura como máximo 2 veces por acto); el agua de la verdad revela todos los objetos de quien bebe, o una copa al azar de la mesa si no tiene. Cada copa bebida suma 1 de Embriaguez. Con Embriaguez 3–4, la aguja de plata y el olfato dan información falsa la mitad de las veces, y el veneno quita 1 PV extra. Con Embriaguez 5 te desplomas y vuelcas la mesa: Embriaguez a 0, +1 PV, pierdes tu próxima acción, todas las copas se barajan y la información conocida se anula. Al final de cada acto ambos bajan 1 de Embriaguez.', 'Gift kostet den Trinkenden 1 LP; Nektar heilt 1 LP und gibt eine weitere Aktion (pro Akt höchstens 2 Heilungen je Seite); Wahrheitswasser deckt alle Gegenstände des Trinkenden auf, bei leerer Hand einen zufälligen Tischkelch. Jeder getrunkene Kelch gibt +1 Rausch. Bei Rausch 3–4 zeigen Silbernadel und Wittern in der Hälfte der Fälle falsche Infos, und Gift kostet 1 LP mehr. Bei Rausch 5 kippst du um und stößt den Tisch um: Rausch auf 0, +1 LP, nächste Aktion entfällt, alle Kelche neu gemischt, alle Infos verfallen. Am Ende jedes Akts sinkt der Rausch beider Seiten um 1.', '猛毒は飲んだ側のHPを1減らす。甘露はHPを1回復して再行動（回復は1幕につき各自最大2回）。真言水は飲んだ側の全ての道具を公開し、道具がなければ卓上の杯を1つランダムに公開する。杯を飲むたびに酔い+1。酔い3〜4では、銀の針と嗅ぎ分けが半々の確率で誤情報になり、猛毒のダメージも+1。酔い5で酔いつぶれて卓をひっくり返す：酔い0、HP+1、次の行動をスキップ、全ての杯をシャッフルし、既知の情報は全て無効になる。各幕の終わりに双方の酔いが1下がる。', '맹독은 마신 사람의 HP를 1 깎고, 감로는 HP 1을 회복하고 한 번 더 행동한다(막당 각자 최대 2회 회복). 진언수는 마신 사람의 도구를 모두 공개하며, 도구가 없으면 탁자 위 잔 하나를 무작위로 공개한다. 잔을 마실 때마다 취기 +1. 취기 3~4에서는 은침과 향 맡기가 절반 확률로 틀린 정보를 주고 맹독 피해도 1 늘어난다. 취기 5가 되면 쓰러져 탁자를 뒤엎는다: 취기 0, HP +1, 다음 행동 건너뜀, 모든 잔이 다시 섞이고 알던 정보는 전부 무효. 각 막이 끝나면 양쪽 취기가 1씩 내려간다.', '劇毒讓飲用者失去 1 點生命；瓊漿回復 1 點生命並再行動一次（每幕每人最多回血 2 次）；真言水會公開飲用者的全部手牌，沒有手牌時改為隨機公開桌上一杯。每喝一杯，酒醉加 1。酒醉 3 到 4 時，銀針和聞香有一半機率顯示錯誤情報，劇毒也會多扣 1 點。酒醉到 5 會醉倒翻桌：酒醉歸零、回復 1 點生命、跳過自己的下一次行動，桌上所有酒杯重新洗牌，已知情報全部作廢。每幕結束雙方酒醉各減 1。')
add('v.r5', 'Ten items: Silver Needle (inspect one cup), Sniff (count dangerous wine in two cups), Sobering Draught (+1 HP, Drunk −2, no more items this turn), Spiked Liquor (next cup: poison fixed at 2, nectar doubled), Sleight of Hand (poison, nectar, truth water rotate in order), Toast Decree (the Host must drink on his next action), Cheers! (you and the Host each drink the same cup once), Spin the Wheel (reshuffle everything), Concentrated Powder (poison becomes double, nectar becomes poisoned nectar), Diluting Ice (double poison → poison, poison → water, poisoned nectar → nectar). Each item can be used once per turn.', 'Diez objetos: aguja de plata (inspeccionar una copa), olfatear (contar vino peligroso en dos copas), poción de sobriedad (+1 PV, Embriaguez −2, sin más objetos este turno), licor adulterado (próxima copa: veneno fijo en 2, néctar doble), cambiazo (veneno, néctar y agua de la verdad rotan en orden), brindis forzado (el anfitrión debe beber en su próxima acción), ¡Salud! (tú y el anfitrión bebéis una vez de la misma copa), girar la ruleta (barajar todo), polvo concentrado (el veneno pasa a doble, el néctar a néctar envenenado), hielo diluyente (doble veneno → veneno, veneno → agua, néctar envenenado → néctar). Cada objeto se usa una vez por turno.', 'Zehn Gegenstände: Silbernadel (einen Kelch prüfen), Wittern (gefährliche Weine in zwei Kelchen zählen), Ernüchterungstrank (+1 LP, Rausch −2, danach keine Gegenstände in diesem Zug), Starker Schnaps (nächster Kelch: Gift fix 2, Nektar doppelt), Taschenspielertrick (Gift, Nektar, Wahrheitswasser rotieren der Reihe nach), Trinkzwang (der Gastgeber muss bei seiner nächsten Aktion trinken), Prost! (du und der Gastgeber trinkt je einmal aus demselben Kelch), Rad drehen (alles neu mischen), Giftpulver (Gift wird doppelt, Nektar wird vergifteter Nektar), Verdünnungseis (Doppelgift → Gift, Gift → Wasser, vergifteter Nektar → Nektar). Jeder Gegenstand darf pro Zug nur einmal benutzt werden.', '道具は10種類：銀の針（杯を1つ調べる）、嗅ぎ分け（2杯の危険な酒を数える）、酔い覚まし（HP+1・酔い−2、このターンはもう道具不可）、強い酒（次の杯：猛毒は2固定、甘露は倍）、すり替え（猛毒→甘露→真言水の順に変える）、乾杯令（ホストは次の行動で必ず自分で飲む）、乾杯！（双方が同じ杯を1回ずつ飲む）、回転盤（全てシャッフル）、濃縮毒粉（猛毒は二重に、甘露は毒入り甘露に）、希釈氷（二重の毒→猛毒、猛毒→清水、毒入り甘露→甘露）。同じ道具は1ターンに1回まで。', '도구는 10종: 은침(잔 하나 확인), 향 맡기(두 잔의 위험한 술 수 세기), 해독약(HP +1, 취기 −2, 이번 턴 도구 사용 불가), 독주(다음 잔: 맹독 2 고정, 감로 2배), 바꿔치기(맹독→감로→진언수 순으로 변환), 건배령(호스트는 다음 행동에서 반드시 직접 마심), 건배!(양쪽이 같은 잔을 한 번씩 마심), 룰렛(전부 다시 섞기), 농축 독가루(맹독은 이중으로, 감로는 독 감로로), 희석 얼음(이중 독→맹독, 맹독→맑은 물, 독 감로→감로). 같은 도구는 한 턴에 한 번만 쓸 수 있다.', '十種道具：銀針（查看一杯）、聞香（數兩杯裡的危險酒）、醒酒藥（回 1 血、酒醉減 2，用後本回合不能再用道具）、烈酒摻雜（下一杯劇毒固定 2 點、瓊漿加倍）、偷天換日（劇毒、瓊漿、真言水依序輪替）、勸酒令（莊家下次行動必須自己喝）、乾杯！（你和莊家各喝一次同一杯）、轉盤（全部重新洗牌）、濃縮毒粉（劇毒變雙倍、瓊漿變毒瓊漿）、稀釋冰塊（雙倍劇毒變劇毒、劇毒變清水、毒瓊漿變瓊漿）。同名道具每回合最多用一次。')
add('v.r6', 'Whoever reaches 0 HP loses. When Act III ends, the higher HP wins; equal HP leads to a 3-minute overtime (5 cups per round: Poison 3, Truth Water 2); when time runs out HP is compared, and equal HP is a draw. The Host never peeks at your hand and does not know what you found out.', 'Pierde quien llegue a 0 PV. Al terminar el Acto III gana quien tenga más PV; si empatan, hay una prórroga de 3 minutos (5 copas por ronda: veneno 3, agua de la verdad 2); al acabar el tiempo se comparan los PV y, si siguen iguales, hay empate. El anfitrión nunca espía tu mano ni sabe lo que has averiguado.', 'Wer 0 LP erreicht, verliert. Endet Akt III, gewinnt, wer mehr LP hat; bei Gleichstand folgt eine 3-minütige Verlängerung (5 Kelche pro Runde: Gift 3, Wahrheitswasser 2); bei Zeitablauf werden die LP verglichen, bei Gleichstand gibt es ein Unentschieden. Der Gastgeber späht nie in deine Hand und weiß nicht, was du herausgefunden hast.', 'HPが0になった側の負け。第三幕の終了時にHPが高い方が勝ち、同じなら3分間の延長戦（毎ラウンド5杯：猛毒3・真言水2）。時間切れでHPを比べ、それでも同じなら引き分け。ホストはあなたの手札を覗かず、あなたが調べた情報も知らない。', 'HP가 0이 되면 패배. 3막이 끝났을 때 HP가 높은 쪽이 승리하고, 같으면 3분 연장전(라운드당 5잔: 맹독 3, 진언수 2)에 들어간다. 시간이 끝나면 HP를 비교하고 그래도 같으면 무승부. 호스트는 당신의 패를 엿보지 않으며 당신이 알아낸 정보도 모른다.', '任一方生命歸零就輸。第三幕結束時生命較高的獲勝；生命相同進入 3 分鐘延長賽（每輪 5 杯：劇毒 3、真言水 2），時間到比生命，仍相同為平手。莊家不會偷看你的手牌，也不知道你查到了什麼。')
add('v.r7', 'BONUS is a fixed reward credited immediately: surviving Act I +1, Act II +2, Act III +3, winning the banquet +2; each is paid once per round, 8 at most. Score is not converted directly into points; the result depends on judgment, memory and chance, and there are no wagers. Credited points are never taken back if you lose later.', 'El BONUS es una recompensa fija que se acredita al instante: sobrevivir al Acto I +1, al II +2, al III +3 y ganar el banquete +2; cada uno se paga una vez por partida, 8 como máximo. La puntuación no se convierte directamente en puntos; el resultado depende del juicio, la memoria y el azar, y no hay apuestas. Los puntos acreditados no se retiran si pierdes después.', 'BONUS ist eine feste, sofort gutgeschriebene Belohnung: Akt I überstanden +1, Akt II +2, Akt III +3, Bankett gewonnen +2; jede wird pro Runde nur einmal gezahlt, maximal 8. Die Wertung wird nicht direkt in Punkte umgerechnet; das Ergebnis hängt von Urteil, Gedächtnis und Zufall ab, es gibt keine Einsätze. Gutgeschriebene Punkte werden nicht zurückgenommen, wenn du später verlierst.', 'BONUSは固定報酬で、即時に付与される：第一幕を生き延びて+1、第二幕で+2、第三幕で+3、晩餐に勝利して+2。各項目は1ラウンドに1回のみ、最大8ポイント。スコアが直接ポイントに換算されることはなく、結果は判断・記憶・確率で決まり、賭けはない。付与済みのポイントは、後で負けても取り消されない。', 'BONUS는 즉시 지급되는 고정 보상이다: 1막 생존 +1, 2막 생존 +2, 3막 생존 +3, 만찬 승리 +2. 각 항목은 판당 한 번만 지급되며 최대 8점. 점수가 곧바로 포인트로 환산되지는 않으며 결과는 판단·기억·확률로 정해지고 베팅은 없다. 지급된 포인트는 나중에 져도 회수되지 않는다.', 'BONUS 為固定獎勵、立即入帳：撐過第一幕 +1 點、撐過第二幕 +2 點、撐過第三幕 +3 點、贏得這場晚宴 +2 點；每項每局只發一次，全拿最多 8 點。分數不直接換點數，結果取決於判斷、記憶與機率，沒有任何下注。已入帳的點數不會因為之後輸掉而收回。')
add('v.r8', 'Switching games or a background tab pauses the game and it resumes when you return. Refreshing forfeits the round; credited points are kept. Wins are saved in your browser; points are shared with the other games and have no cash value.', 'Cambiar de juego o de pestaña pausa la partida y continúa al volver. Recargar abandona la partida; los puntos ya acreditados se conservan. Las victorias se guardan en el navegador; los puntos se comparten con los demás juegos y no tienen valor en dinero.', 'Beim Wechsel des Spiels oder Tabs pausiert das Spiel und läuft bei Rückkehr weiter. Neu laden gibt die Runde auf; gutgeschriebene Punkte bleiben erhalten. Siege werden im Browser gespeichert; Punkte werden mit den anderen Spielen geteilt und haben keinen Geldwert.', 'ゲームや背景タブを切り替えると一時停止し、戻ると再開する。再読み込みすると対戦は放棄扱いになるが、付与済みのポイントは残る。勝利数はブラウザに保存され、ポイントは他のゲームと共通で、現金価値はない。', '게임이나 백그라운드 탭을 전환하면 일시정지되고 돌아오면 이어진다. 새로고침하면 판은 포기 처리되지만 지급된 포인트는 유지된다. 승수는 브라우저에 저장되며, 포인트는 다른 게임과 공유되고 현금 가치가 없다.', '切換遊戲或背景分頁會暫停，回來後繼續。重新整理會放棄本局，已入帳的點數會保留。勝場保存在瀏覽器中；點數與其他遊戲共用，沒有現金價值。')
add('v.title', 'The Last Banquet', 'La Última Cena', 'Das Letzte Bankett', '最後の晩餐', '마지막 만찬', '最後的晚餐')
add('v.tag', 'One poisoned cup. One smiling host. Drink, offer, or bluff your way to dawn.', 'Una copa envenenada. Un anfitrión sonriente. Bebe, ofrece o farolea hasta el amanecer.', 'Ein vergifteter Kelch. Ein lächelnder Gastgeber. Trinken, reichen oder bluffen bis zum Morgengrauen.', '毒の杯がひとつ、微笑む主催者がひとり。飲み、差し出し、ハッタリで夜明けまで。', '독이 든 잔 하나, 미소 짓는 주인 한 명. 마시고, 권하고, 속이며 새벽까지.', '一杯毒酒，一位微笑的莊家。自己喝、敬酒或吹牛，撐到天亮。')
add('v.back', 'Back', 'Volver', 'Zurück', '戻る', '뒤로', '返回')
add('v.use', 'Use', 'Usar', 'Benutzen', '使う', '사용', '使用')
add('v.close', 'Close', 'Cerrar', 'Schließen', '閉じる', '닫기', '關閉')
add('v.lang', 'Language', 'Idioma', 'Sprache', '言語', '언어', '語言')


def render():
    data = {lang: {k: v[lang] for k, v in T.items()} for lang in LANGS}
    body = json.dumps(data, ensure_ascii=True, separators=(',', ':'), sort_keys=False)
    return ('/* Generated by tools/banquet_i18n.py; edit that file, not this one. ASCII-escaped on purpose. */\n'
            'var BQ_I18N=' + body + ';\n')


def main():
    for key, row in T.items():
        for lang in LANGS:
            assert row[lang].strip() or key == 'sep', (key, lang)
        # every language must use the same placeholders as English
        import re
        want = sorted(set(re.findall(r'\{[a-z.A-Z]+\}', row['en'])))
        for lang in LANGS[1:]:
            got = sorted(set(re.findall(r'\{[a-z.A-Z]+\}', row[lang])))
            assert got == want or (key.startswith('l.') and set(got) <= set(want) | {'{a.N}', '{o.N}', '{o.D}', '{a.D}', '{o.S}', '{a.S}', '{o.O}'}), (key, lang, want, got)
    text = render()
    if '--check' in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding='utf-8') != text:
            print('games/banquet/i18n.js is stale. Run: python3 tools/banquet_i18n.py', file=sys.stderr)
            return 1
        print('OK: banquet i18n.js matches tools/banquet_i18n.py')
        return 0
    OUT.write_text(text, encoding='utf-8')
    print(f'Wrote {OUT.relative_to(ROOT)} ({len(T)} keys x {len(LANGS)} languages)')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
