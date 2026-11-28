-- New time board IDs preserve the historical Mermaid Spider score board.
INSERT OR REPLACE INTO game_names (game_id,game_name,game_name_en,game_name_zh_cn) VALUES
('mermaid-time-1','人魚蜘蛛接龍 · 1 花色','Mermaid Spider · 1 Suit','人鱼蜘蛛接龙 · 1 花色'),
('mermaid-time-2','人魚蜘蛛接龍 · 2 花色','Mermaid Spider · 2 Suits','人鱼蜘蛛接龙 · 2 花色'),
('mermaid-time-4','人魚蜘蛛接龍 · 4 花色','Mermaid Spider · 4 Suits','人鱼蜘蛛接龙 · 4 花色'),
('midnight-solitaire-time','夜航經典接龍','Midnight Klondike','夜航经典接龙'),
('orbit-freecell-time','星軌新接龍','Orbit FreeCell','星轨新接龙');

UPDATE game_names SET game_name='人魚蜘蛛接龍',game_name_en='Mermaid Spider',game_name_zh_cn='人鱼蜘蛛接龙' WHERE game_id='mermaid';

INSERT INTO game_names (game_id,game_name,game_name_en,game_name_zh_cn) VALUES ('midnight-solitaire','夜航經典接龍','Midnight Klondike','夜航经典接龙'),('orbit-freecell','星軌新接龍','Orbit FreeCell','星轨新接龙');
