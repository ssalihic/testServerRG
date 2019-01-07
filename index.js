const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
var port = process.env.PORT || 9000;

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// genericka metoda za sobe da se updatuje kolona unutar igravrijeme.csv
// morate poslati unutar body-a sljedece:
// 'korisnik' - ime korisnika kojem se mijenja vrijeme, uvijek ce biti legalan korisnik
// 'brojSobe' - brojSobe sto moze biti 1 2 3 4
// 'novaVrijednost' - ono sto se upisuje na to mjesto
app.post('/update', (req, res) => {
    let tijelo = req.body;
    // nulti element u csv fajlu
    let korisnik = tijelo['korisnik'];
    // moze biti 1,2,3,4
    let brojSobe = tijelo['brojSobe'];
    // ova vrijednost mora biti x.AB:CD
    let novoVrijemeIZavrsenost = tijelo['novaVrijednost'];
    let pamti = false;
    fs.readFile(path.join(__dirname + '/igravrijeme.csv'), function (err, data) {
        let sviKorisnici = data.toString().split('\n');
        for (let i = 0; i < sviKorisnici.length - 1; ++i) {
            let korisnikTrenutni = sviKorisnici[i].split(",");
            if (korisnikTrenutni[0] == korisnik) {
                if (brojSobe == 1)
                    sviKorisnici[i] = `${korisnik},${novoVrijemeIZavrsenost},${korisnikTrenutni[2]},${korisnikTrenutni[3]},${korisnikTrenutni[4]}`;
                else if (brojSobe == 2)
                    sviKorisnici[i] = `${korisnik},${korisnikTrenutni[1]},${novoVrijemeIZavrsenost},${korisnikTrenutni[3]},${korisnikTrenutni[4]}`;
                else if (brojSobe == 3)
                    sviKorisnici[i] = `${korisnik},${korisnikTrenutni[1]},${korisnikTrenutni[2]},${novoVrijemeIZavrsenost},${korisnikTrenutni[4]}`;
                else if (brojSobe == 4)
                    sviKorisnici[i] = `${korisnik},${korisnikTrenutni[1]},${korisnikTrenutni[2]},${korisnikTrenutni[3]},${novoVrijemeIZavrsenost}`;

                pamti = true;
                break;
            }
        }
        if (pamti) {
            // upisivanje u novi fajl
            fs.writeFileSync(path.join(__dirname + '/igravrijeme.csv'), "", (err) => {
                if (err) throw err;
            });
            for (let i = 0; i < sviKorisnici.length - 1; ++i) {
                (function odradi(i) {
                    fs.appendFileSync(path.join(__dirname + '/igravrijeme.csv'), sviKorisnici[i] + "\n", (err) => {
                        if (err) throw err;
                    });
                })(i);
            }
            res.send(true);
        } else res.send(false);
    });
});



// gleda jel username/pw jednak i vraca result valjal
app.post('/userpw', (req, res) => {
    let tijelo = req.body;
    let username = tijelo['username'];
    let password = tijelo['password'];
    let pamti = false;
    //res.send(true);
    //return;
    fs.readFile(path.join(__dirname + '/korisnici.csv'), function (err, data) {
        let sviKorisnici = data.toString().split('\n');
        for (let i = 0; i < sviKorisnici.length; ++i) {
            let info = sviKorisnici[i].split(",");
            let tempuser = info[0];
            let temppass = info[1];
            if (username == tempuser && password == temppass) {
                pamti = true;
                break;
            }
        }
        if (pamti) res.send(true);
        else res.send(false);
    });
});

// vraca json objekata iz igravrijeme
// sluzi za prikaz rang liste
app.get('/dajJsonIgre', (req, res) => {
    fs.readFile(path.join(__dirname + '/igravrijeme.csv'), (err, contents) => {
        if (err) {
            res.writeHead(504, {
                'Content-Type': 'application/json'
            });
            throw err;
        }
        let spisakLjudi = contents.toString().split("\n");
        let nizObjekata = [];
        for (let i = 0; i < spisakLjudi.length - 1; ++i) {
            let parametri = spisakLjudi[i].split(",");
            let objekat = {
                korisnik: parametri[0],
                soba1: parametri[1],
                soba2: parametri[2],
                soba3: parametri[3],
                soba4: parametri[4]
            };
            nizObjekata.push(objekat);
        }
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        let objekat = {
            "duzina": spisakLjudi.length - 1,
            "nizObjekata": nizObjekata
        };
        res.end(JSON.stringify(objekat));
    });
});

// vraca json igraca koji trenutno igra, da mu se vrijeme prikazuje
// u hodniku uvijek
app.post('/dajIgraca', (req, res) => {
    let tijelo = req.body;
    let user = tijelo['korisnik'];
    let objekat = null;
    fs.readFile(path.join(__dirname + '/igravrijeme.csv'), (err, contents) => {
        if (err) {
            res.writeHead(504, {
                'Content-Type': 'application/json'
            });
            throw err;
        }
        let spisakLjudi = contents.toString().split("\n");
        for (let i = 0; i < spisakLjudi.length - 1; ++i) {
            let parametri = spisakLjudi[i].split(",");
            if (parametri[0] == user) {
                objekat = {
                    korisnik: parametri[0],
                    soba1: parametri[1],
                    soba2: parametri[2],
                    soba3: parametri[3],
                    soba4: parametri[4]
                };
                break;
            }
        }
        res.writeHead(200, {
            'Content-Type': 'application/json'
        });
        res.end(JSON.stringify(objekat));
    });
});

// dizemo igricu na localhost:9000
app.use(express.static('./igra'));

app.listen(port, () => {
    console.log("Slušam 9000 port!");
});