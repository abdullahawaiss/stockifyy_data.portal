// Static reference data for PSX-listed companies
// Used as fallback when DB is empty

export interface CompanyDetail {
  listingDate?: string;
  fiscalYearEnd?: string;  // e.g. "June 30" or "December 31"
  shariahStatus?: "Shariah Compliant" | "Non-Compliant";
  freeFloat?: string;       // e.g. "35%"
  website?: string;
}

const DETAILS: Record<string, CompanyDetail> = {
  // ── Commercial Banks ──────────────────────────────────────────────────────
  HBL:   { listingDate: "1947-08-14", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",   freeFloat: "45%", website: "https://www.hbl.com" },
  MCB:   { listingDate: "1947-08-14", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",   freeFloat: "40%", website: "https://www.mcb.com.pk" },
  UBL:   { listingDate: "1959-11-07", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",   freeFloat: "42%", website: "https://www.ubldigital.com" },
  BAFL:  { listingDate: "2002-09-17", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",   freeFloat: "38%", website: "https://www.bankofpunjab.com.pk" },
  BAHL:  { listingDate: "2003-07-17", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",   freeFloat: "22%", website: "https://www.bahl.com.pk" },
  NBP:   { listingDate: "1949-01-09", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",   freeFloat: "24%", website: "https://www.nbp.com.pk" },
  MEBL:  { listingDate: "2009-06-04", fiscalYearEnd: "December 31", shariahStatus: "Shariah Compliant", freeFloat: "35%", website: "https://embankonline.com" },
  ABL:   { listingDate: "2000-11-17", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",   freeFloat: "30%", website: "https://www.abl.com" },
  FABL:  { listingDate: "2014-06-11", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",   freeFloat: "28%", website: "https://www.faysalbank.com" },
  JSBL:  { listingDate: "2006-11-27", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",   freeFloat: "32%", website: "https://www.jsbl.com" },
  BOP:   { listingDate: "2005-06-29", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",   freeFloat: "20%", website: "https://www.bop.com.pk" },
  BIPL:  { listingDate: "1988-06-01", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",   freeFloat: "25%", website: "https://www.bankislamidigital.com" },
  SILKB: { listingDate: "2006-05-04", fiscalYearEnd: "December 31", shariahStatus: "Shariah Compliant", freeFloat: "18%", website: "https://www.silkbank.com.pk" },
  SNBL:  { listingDate: "2002-08-28", fiscalYearEnd: "December 31", shariahStatus: "Shariah Compliant", freeFloat: "30%", website: "https://www.soneribank.com" },
  AKBL:  { listingDate: "2004-06-14", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",   freeFloat: "35%", website: "https://www.askaribank.com.pk" },
  KASBB: { listingDate: "2000-12-28", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",   freeFloat: "15%", website: "https://www.kasb.com" },
  AGTL:  { listingDate: "2002-01-29", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",   freeFloat: "22%", website: "https://www.arif-habib.com" },
  IBLHL: { listingDate: "2009-04-08", fiscalYearEnd: "December 31", shariahStatus: "Shariah Compliant", freeFloat: "20%", website: "https://www.iblinvest.com.pk" },

  // ── Oil & Gas ─────────────────────────────────────────────────────────────
  OGDC:  { listingDate: "1997-11-05", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "30%", website: "https://www.ogdcl.com" },
  PPL:   { listingDate: "2004-11-18", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "28%", website: "https://www.ppl.com.pk" },
  PSO:   { listingDate: "1978-09-21", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "40%", website: "https://www.psopk.com" },
  MARI:  { listingDate: "2007-03-22", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "25%", website: "https://www.mari-gas.com" },
  SNGP:  { listingDate: "1983-11-29", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "32%", website: "https://www.sngpl.com.pk" },
  SSGC:  { listingDate: "1958-07-12", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "35%", website: "https://www.ssgc.com.pk" },
  HASCOL:{ listingDate: "2007-10-17", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "42%", website: "https://www.hascol.com" },

  // ── Fertilizer ────────────────────────────────────────────────────────────
  ENGRO: { listingDate: "1991-03-01", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "44%", website: "https://www.engro.com" },
  EFERT: { listingDate: "2010-07-22", fiscalYearEnd: "December 31", shariahStatus: "Shariah Compliant", freeFloat: "30%", website: "https://www.engroxpand.com" },
  FFBL:  { listingDate: "1996-03-06", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "38%", website: "https://www.ffbl.com" },
  FFC:   { listingDate: "1978-06-28", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "35%", website: "https://www.ffc.com.pk" },
  FATIMA:{ listingDate: "2010-04-14", fiscalYearEnd: "December 31", shariahStatus: "Shariah Compliant", freeFloat: "25%", website: "https://www.fatimagroup.com.pk" },
  DAWH:  { listingDate: "2003-06-19", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "20%", website: "https://www.dawood.com.pk" },
  KNFC:  { listingDate: "2005-05-27", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "22%", website: "https://www.khannutfertilizer.com" },

  // ── Cement ───────────────────────────────────────────────────────────────
  LUCK:  { listingDate: "1997-05-06", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "38%", website: "https://www.lucky-cement.com" },
  DGKC:  { listingDate: "1988-01-01", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "30%", website: "https://www.dgcement.com" },
  MLCF:  { listingDate: "1999-02-04", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "28%", website: "https://www.mapleleafcement.com" },
  FECTC: { listingDate: "1996-04-11", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "22%", website: "https://www.faujicement.com" },
  CHCC:  { listingDate: "2003-11-28", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "25%", website: "https://www.chcc.com.pk" },
  ACPL:  { listingDate: "2005-01-12", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "23%", website: "https://www.aclpakistan.com" },
  KOHC:  { listingDate: "1997-12-26", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "20%", website: "https://www.kohcement.com" },
  PIOC:  { listingDate: "1993-12-31", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "18%", website: "https://www.pioneercement.com.pk" },
  FCCL:  { listingDate: "1996-01-29", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "20%", website: "https://www.falconcement.com" },
  GWLC:  { listingDate: "1985-05-08", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "15%", website: "https://www.gwlc.com.pk" },
  BWCL:  { listingDate: "1980-04-10", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "18%", website: "https://www.bestwaycement.com" },
  POWER: { listingDate: "2018-07-03", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "20%", website: "https://www.powercement.com.pk" },

  // ── Power Generation ──────────────────────────────────────────────────────
  KAPCO: { listingDate: "1996-10-25", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "32%", website: "https://www.kapco.com.pk" },
  HUBC:  { listingDate: "1992-08-20", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "40%", website: "https://www.hubpower.com" },
  KEL:   { listingDate: "1945-09-01", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "45%", website: "https://www.ke.com.pk" },
  EPQL:  { listingDate: "2015-11-09", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "15%", website: "https://www.engropowergen.com" },
  PKGP:  { listingDate: "2016-03-11", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "14%", website: "https://www.pkgp.com.pk" },
  NCPL:  { listingDate: "2007-06-15", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "18%", website: "https://www.ncpl.com.pk" },

  // ── Technology ────────────────────────────────────────────────────────────
  SYS:   { listingDate: "2015-07-08", fiscalYearEnd: "December 31", shariahStatus: "Shariah Compliant", freeFloat: "28%", website: "https://www.systems.com.pk" },
  TRG:   { listingDate: "2001-03-16", fiscalYearEnd: "December 31", shariahStatus: "Shariah Compliant", freeFloat: "55%", website: "https://www.trgworld.com" },
  NETSOL:{ listingDate: "1995-05-11", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "35%", website: "https://www.netsoltech.com" },
  ITANZ: { listingDate: "2004-07-29", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "25%", website: "https://www.i-t.com.pk" },
  AVN:   { listingDate: "2001-09-19", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "22%", website: "https://www.avanceon.com" },

  // ── Refinery ──────────────────────────────────────────────────────────────
  PRL:   { listingDate: "1962-02-14", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "30%", website: "https://www.prl.com.pk" },
  ATRL:  { listingDate: "1980-01-14", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "28%", website: "https://www.atrl.com.pk" },
  NRL:   { listingDate: "1963-09-17", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "25%", website: "https://www.nrl.com.pk" },
  PARCO: { listingDate: "2003-01-13", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "20%", website: "https://www.parco.com.pk" },

  // ── Insurance ─────────────────────────────────────────────────────────────
  AICL:  { listingDate: "1953-03-19", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "32%", website: "https://www.adamjeeins.com" },
  IGI:   { listingDate: "1966-03-03", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "28%", website: "https://www.igiinsurance.com.pk" },
  JSGICL:{ listingDate: "2005-07-13", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "25%", website: "https://www.jsinsurance.com.pk" },
  UIC:   { listingDate: "1950-09-06", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "20%", website: "https://www.uic.com.pk" },
  HIC:   { listingDate: "2006-08-14", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "22%", website: "https://www.habibinsurance.com" },

  // ── Textile ───────────────────────────────────────────────────────────────
  NCL:   { listingDate: "1995-05-08", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "20%", website: "https://www.nishat.net" },
  GATM:  { listingDate: "2003-06-20", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "18%", website: "https://www.gatm.com.pk" },
  DSIL:  { listingDate: "1987-12-31", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "15%", website: "https://www.dsilpk.com" },
  DSIL2: { listingDate: "2012-05-21", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "14%", website: "https://www.dsilpk.com" },
  KOSM:  { listingDate: "1994-04-28", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "16%", website: "https://www.kosmosgroup.com" },
  DFSM:  { listingDate: "2008-09-29", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "12%", website: "https://www.dfsm.com.pk" },

  // ── Engineering / Auto ────────────────────────────────────────────────────
  PSMC:  { listingDate: "1992-09-24", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "30%", website: "https://www.pak-suzuki.com.pk" },
  INDU:  { listingDate: "1992-12-11", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "28%", website: "https://www.indusmotor.com.pk" },
  HCAR:  { listingDate: "1994-10-10", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "25%", website: "https://www.honda.com.pk" },
  ATLH:  { listingDate: "1970-01-01", fiscalYearEnd: "March 31",    shariahStatus: "Non-Compliant",     freeFloat: "20%", website: "https://www.atlasbattery.com.pk" },
  ATML:  { listingDate: "1988-07-19", fiscalYearEnd: "March 31",    shariahStatus: "Shariah Compliant", freeFloat: "22%", website: "https://www.atlasmetals.com.pk" },
  MUGHAL:{ listingDate: "2010-01-18", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "30%", website: "https://www.mughaliron.com" },

  // ── Pharmaceuticals ───────────────────────────────────────────────────────
  GLAXO: { listingDate: "1972-06-01", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "25%", website: "https://www.gsk.com.pk" },
  SEARL: { listingDate: "1990-09-17", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "30%", website: "https://www.searl.com.pk" },
  AGP:   { listingDate: "2017-07-31", fiscalYearEnd: "December 31", shariahStatus: "Shariah Compliant", freeFloat: "35%", website: "https://www.agp.com.pk" },
  FEROZ: { listingDate: "1974-03-28", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "22%", website: "https://www.ferozsons.com.pk" },
  HINOON:{ listingDate: "1992-01-23", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "20%", website: "https://www.hinoonlabs.com" },

  // ── Food & Consumer ───────────────────────────────────────────────────────
  NESTLE:{ listingDate: "1979-03-28", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "26%", website: "https://www.nestle.com.pk" },
  COLG:  { listingDate: "1968-05-22", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "24%", website: "https://www.colgatepalmolive.com.pk" },
  UNITY: { listingDate: "2002-04-10", fiscalYearEnd: "September 30",shariahStatus: "Shariah Compliant", freeFloat: "28%", website: "https://www.unityfoods.com.pk" },
  FFL:   { listingDate: "2001-03-12", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "25%", website: "https://www.faujifoods.com.pk" },
  EPCL:  { listingDate: "2018-07-18", fiscalYearEnd: "December 31", shariahStatus: "Shariah Compliant", freeFloat: "22%", website: "https://www.epcl.com.pk" },

  // ── Miscellaneous ─────────────────────────────────────────────────────────
  JSCL:  { listingDate: "1975-07-09", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "20%", website: "https://www.js.com.pk" },
  RMPL:  { listingDate: "1986-07-01", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "18%", website: "https://www.rmplpk.com" },
  ISL:   { listingDate: "1980-11-19", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "30%", website: "https://www.ismail-steel.com" },
  AMTEX: { listingDate: "2005-05-09", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "15%", website: "https://www.amtex.com.pk" },
  WTL:   { listingDate: "2005-07-06", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "40%", website: "https://www.worldcalltelecoms.com" },
  TELE:  { listingDate: "2002-04-30", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "35%", website: "https://www.telecarditalia.com" },
  PAEL:  { listingDate: "2012-03-26", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "20%", website: "https://www.paelpk.com" },
  BECO:  { listingDate: "2005-09-15", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "16%", website: "https://www.beco.com.pk" },
  FCEPL: { listingDate: "2013-02-04", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "18%", website: "https://www.fcepl.com.pk" },
  ZTL:   { listingDate: "2000-01-12", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "14%", website: "https://www.ztl.com.pk" },
  SYS2:  { listingDate: "2020-08-21", fiscalYearEnd: "December 31", shariahStatus: "Shariah Compliant", freeFloat: "20%", website: "https://www.systems.com.pk" },
  GNFC:  { listingDate: "2020-12-28", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "15%", website: "https://www.gnfc.com.pk" },
  NNFC:  { listingDate: "1997-05-28", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "18%", website: "https://www.nnfc.com.pk" },
  LNFC:  { listingDate: "2002-09-20", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "12%", website: "https://www.lnfc.com.pk" },
  MNFC:  { listingDate: "2003-07-25", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "10%", website: "https://www.mnfc.com.pk" },
  HINO:  { listingDate: "1986-04-24", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "22%", website: "https://www.hinopak.com" },
  ATBA:  { listingDate: "1974-10-21", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "20%", website: "https://www.atlasengineering.com.pk" },
  PABC:  { listingDate: "2002-04-25", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "18%", website: "https://www.pabc.com.pk" },
  OLPL:  { listingDate: "1965-04-26", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "22%", website: "https://www.olpl.com.pk" },
  SCBPL: { listingDate: "1974-07-31", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "30%", website: "https://www.sc.com/pk" },
  ARPL:  { listingDate: "2003-01-02", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "15%", website: "https://www.arpl.com.pk" },
  PTL:   { listingDate: "2002-06-28", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "20%", website: "https://www.ptl.com.pk" },
  HALEON:{ listingDate: "1947-08-14", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "24%", website: "https://www.haleonpakistan.com" },
  ICI:   { listingDate: "1955-07-28", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "28%", website: "https://www.ici.com.pk" },
  DESCON:{ listingDate: "2008-07-17", fiscalYearEnd: "August 31",   shariahStatus: "Non-Compliant",     freeFloat: "20%", website: "https://www.descon.com" },
  PCAL2: { listingDate: "2004-01-30", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "18%", website: "https://www.pakelectron.com.pk" },
  FCL:   { listingDate: "1960-07-01", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "25%", website: "https://www.fcl.com.pk" },
  TATM:  { listingDate: "1966-01-01", fiscalYearEnd: "December 31", shariahStatus: "Shariah Compliant", freeFloat: "20%", website: "https://www.tatm.com.pk" },
  JSML:  { listingDate: "1975-12-31", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "15%", website: "https://www.jsml.com.pk" },
  JSBS:  { listingDate: "2001-11-01", fiscalYearEnd: "December 31", shariahStatus: "Shariah Compliant", freeFloat: "20%", website: "https://www.jsbl.com" },
  ABOT:  { listingDate: "1960-06-01", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "25%", website: "https://www.abbott.com.pk" },
  SIEM:  { listingDate: "1967-01-01", fiscalYearEnd: "September 30",shariahStatus: "Non-Compliant",     freeFloat: "22%", website: "https://www.siemens.com.pk" },
  NBP2:  { listingDate: "2011-05-19", fiscalYearEnd: "December 31", shariahStatus: "Non-Compliant",     freeFloat: "15%", website: "https://www.nbp.com.pk" },
  FHAM:  { listingDate: "2012-07-11", fiscalYearEnd: "December 31", shariahStatus: "Shariah Compliant", freeFloat: "12%", website: "https://www.fham.com.pk" },
  YOUW:  { listingDate: "2014-06-25", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "18%", website: "https://www.youwan.com.pk" },
  IENL:  { listingDate: "2000-12-13", fiscalYearEnd: "June 30",     shariahStatus: "Shariah Compliant", freeFloat: "14%", website: "https://www.ienl.com.pk" },
  AGHA:  { listingDate: "2003-05-19", fiscalYearEnd: "June 30",     shariahStatus: "Non-Compliant",     freeFloat: "18%", website: "https://www.agha.com.pk" },
};

export function getCompanyDetail(symbol: string): CompanyDetail | null {
  return DETAILS[symbol.toUpperCase()] ?? null;
}
