import { HowLongToBeatService, HowLongToBeatEntry } from 'howlongtobeat';
import * as fs from 'fs';

let NEWLINE = "\r\n";

find_all_games(get_game_names())
.then(games => write_results(games))
.catch(error => console.log(error));

function find_all_games(game_names: string[]): Promise<HowLongToBeatEntry[]> {
    let games: Array<HowLongToBeatEntry> = [];
    let promises: Array<Promise<HowLongToBeatEntry>> = [];
    for (let game_name of game_names) {
        promises.push(find_game(game_name)
            .then(matches => {
                if (matches.length > 0) {
                    // console.log("matches = " + matches);
                    console.log(matches[0]);
                    let best_match: HowLongToBeatEntry = matches.filter(match => match.name.startsWith(game_name)).sort(compare_by_similarity)[0];
                    // console.log("best_match = " + best_match);
                    if (!!best_match) {
                        games.push(best_match);
                    }
                }
            })
            .catch(error => 
                console.log(error)
            )
        );
    }
    return Promise.all(promises).then(() => { return games; });
}

function find_game(game_name: string): Promise<HowLongToBeatEntry> {
    return (new HowLongToBeatService()).search(game_name);
}

function is_exact_match(game: HowLongToBeatEntry): boolean {
    return game.similarity === 1;
}

function get_game_names(): string[] {
    return fs.readFileSync('game_library.txt', 'utf8').split(NEWLINE);
}

function write_results(games: Array<HowLongToBeatEntry>) {
    write_library_details(games);

    let gameplayTiers = ["gameplayMain"/*, "gameplayMainExtra", "gameplayCompletionist"*/];
    for (let gameplayTier of gameplayTiers) {
        write_library_playtime(games, gameplayTier);
        write_by_playtime(games, gameplayTier);
    }
}

function write_library_details(games: Array<HowLongToBeatEntry>) {
    appendFile('library_details.csv', "NAME,CASUAL_PLAYTIME,NORMAL_PLAYTIME,COMPLETE_PLAYTIME" + NEWLINE);
    appendFile('library_details.csv', games.sort(compare_by_name).map(x => map_game_data_to_csv_format(x)).join(NEWLINE));
}

function write_library_playtime(games: Array<HowLongToBeatEntry>, gameplayTier: string) {
    let playtime_accumulator = (accumulator, current_game: HowLongToBeatEntry) => accumulator + current_game[gameplayTier];
    let total_playtime = games.reduce(playtime_accumulator, 0);
    let message = "Total Playtime (@ '" + gameplayTier + "' tier): " + total_playtime + NEWLINE;
    appendFile('library_summary.txt', message);
}

function write_by_playtime(games: Array<HowLongToBeatEntry>, gameplayTier: string) {
    let message = "Shortest to Longest games (@ '" + gameplayTier + "' tier): " + NEWLINE + games.sort(compare_by_playtime).map(x => x.name + " (" + x[gameplayTier] + ")" + NEWLINE);
    appendFile('library_summary.txt', message);
}

function map_game_data_to_csv_format(game: HowLongToBeatEntry): string {
    return game.name + "," + game.gameplayMain + "," + game.gameplayMainExtra + "," + game.gameplayCompletionist;
}

function compare_by_name(game1: HowLongToBeatEntry, game2: HowLongToBeatEntry): number {
    return 
        game1.name == game2.name ? 0 :
        game1.name > game2.name ? 1 : -1;
}

function compare_by_similarity(game1: HowLongToBeatEntry, game2: HowLongToBeatEntry): number {
    return game1.similarity - game2.similarity;
}

function compare_by_playtime(game1: HowLongToBeatEntry, game2: HowLongToBeatEntry): number {
    return game1.gameplayMain - game2.gameplayMain;
}

function appendFile(file_name: string, message: string) {
    fs.appendFile(file_name, message, () => {});
}