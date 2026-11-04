import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "EGS Gafsa — Une ville. Un club. Une passion.",
  description: "L’esprit de Gafsa, l’ambition de demain. Découvrez l’identité et la formation de l’El Gawafel sportives de Gafsa, depuis 1967.",
};

const values = [
  { number: "01", title: "Nos racines.", tag: "L’IDENTITÉ", text: "Un nom qui porte celui de sa ville. Des couleurs qui nous rassemblent. À Gafsa, le football est une histoire de transmission.", symbol: "1967" },
  { number: "02", title: "La relève.", tag: "LA FORMATION", text: "Du premier entraînement aux nouvelles ambitions, chaque génération écrit sa propre histoire. Le talent grandit avec le travail et le collectif.", symbol: "↗" },
  { number: "03", title: "Ensemble.", tag: "LE COLLECTIF", text: "Joueurs, éducateurs, supporters : des parcours différents, une même passion. Parce qu’un club se construit avec tous ceux qui le font vivre.", symbol: "EGS" },
];

function Arrow() {
  return <span aria-hidden="true">↗</span>;
}

export default function Home() {
  return (
    <main className="club-landing" id="top">
      <a href="#histoire" className="club-skip">Aller au contenu</a>
      <header className="club-header club-container">
        <Link href="/" className="club-brand" aria-label="EGS Gafsa — Accueil">
          <Image src="/egs-gafsa-logo.png" alt="" width={42} height={54} priority />
          <span>EGS GAFSA<small>EL GAWAFEL SPORTIVES</small></span>
        </Link>
        <nav aria-label="Navigation principale" className="club-nav">
          <a href="#histoire">Le club</a>
          <a href="#formation">Notre ADN</a>
          <a href="#passion">La passion</a>
        </nav>
        <Link href="/login" className="club-staff">Espace club <Arrow /></Link>
      </header>

      <section className="club-hero club-container" aria-labelledby="hero-title">
        <div className="club-hero-copy">
          <p className="club-eyebrow"><span className="club-status" /> GAFSA, TUNISIE <span className="club-eyebrow-line" /> DEPUIS 1967</p>
          <h1 id="hero-title">Plus qu’un club.<br />L’âme d’une <em>ville.</em></h1>
          <p className="club-hero-description">Des racines profondes. Une ambition sans limites.<br />Le cœur de Gafsa bat en vert et jaune.</p>
          <div className="club-hero-actions">
            <a href="#histoire" className="club-button">Entrez dans notre histoire <Arrow /></a>
            <span className="club-arabic" lang="ar" dir="rtl">القوافل الرياضية بقفصة</span>
          </div>
          <div className="club-hero-bottom"><span>UN HÉRITAGE À TRANSMETTRE.</span><a href="#histoire" aria-label="Défiler vers l’histoire du club">DÉFILER <span aria-hidden="true">↓</span></a></div>
        </div>

        <div className="club-emblem-scene" aria-label="Écusson EGS Gafsa, fondé en 1967" role="img">
          <div className="club-scene-grid" />
          <div className="club-orbit club-orbit-outer" />
          <div className="club-orbit club-orbit-inner" />
          <div className="club-orbit-cross club-cross-one" />
          <div className="club-orbit-cross club-cross-two" />
          <span className="club-scene-coordinate">34°25′ N / 8°47′ E</span>
          <span className="club-scene-year">1967</span>
          <div className="club-emblem-halo" />
          <Image className="club-hero-emblem" src="/egs-gafsa-logo.png" alt="" width={245} height={315} priority />
          <span className="club-scene-label">L’HÉRITAGE NOUS PORTE.<br /><strong>L’AVENIR NOUS APPELLE.</strong></span>
          <span className="club-scene-index">EGS / 01</span>
          <div className="club-scene-badge"><span className="club-status" /> FIER DE NOS COULEURS</div>
        </div>
      </section>

      <div className="club-ribbon" aria-hidden="true"><div>UNE VILLE <span>✳</span> UN CLUB <span>✳</span> UNE PASSION <span>✳</span> VERT & JAUNE <span>✳</span> DEPUIS 1967 <span>✳</span> UNE VILLE <span>✳</span> UN CLUB <span>✳</span> UNE PASSION <span>✳</span></div></div>

      <section className="club-story club-container" id="histoire" aria-labelledby="story-title">
        <div className="club-section-label"><span>01 / LE CLUB</span><span>NOTRE HISTOIRE CONTINUE</span></div>
        <div className="club-story-grid">
          <div><p className="club-eyebrow">ANCRÉS À GAFSA. TOURNÉS VERS DEMAIN.</p><h2 id="story-title">L’héritage dans le cœur.<br /><em>L’avenir en ligne de mire.</em></h2></div>
          <div className="club-story-text"><p>Depuis 1967, l’El Gawafel sportives de Gafsa porte bien plus qu’un écusson. Le club incarne un attachement à sa ville et une passion qui traverse les générations.</p><p>Notre force, c’est ce lien. Entre le terrain et les tribunes. Entre ceux qui transmettent et ceux qui rêvent de prendre la relève.</p><a href="#formation" className="club-text-link">Ce qui nous anime <Arrow /></a></div>
        </div>
        <div className="club-facts"><div><strong>1967</strong><span>LE DÉBUT DE L’HISTOIRE</span></div><div><strong>Gafsa<span className="club-fact-dot">.</span></strong><span>NOTRE VILLE, NOTRE FIERTÉ</span></div><div><strong>Vert <em>&</em> jaune</strong><span>DEUX COULEURS, UN MÊME CŒUR</span></div></div>
      </section>

      <section className="club-values" id="formation" aria-labelledby="values-title">
        <div className="club-container">
          <div className="club-section-label"><span>02 / NOTRE ADN</span><span>LE MÊME MAILLOT. LA MÊME EXIGENCE.</span></div>
          <div className="club-values-heading"><h2 id="values-title">Le football nous unit.<br /><em>Nos valeurs nous définissent.</em></h2><p>Une identité forte ne se proclame pas.<br />Elle se vit, sur le terrain et au-delà.</p></div>
          <div className="club-value-grid">{values.map((value) => <article className="club-value-card" key={value.number}><div className="club-card-top"><span>{value.tag}</span><span>{value.number}</span></div><div className={`club-card-symbol club-card-symbol-${value.number}`} aria-hidden="true">{value.symbol}</div><h3>{value.title}</h3><p>{value.text}</p></article>)}</div>
        </div>
      </section>

      <section className="club-passion club-container" id="passion" aria-labelledby="passion-title">
        <p className="club-eyebrow">03 / UNE SEULE PASSION</p>
        <span className="club-passion-arabic" lang="ar" dir="rtl">ديما القوافل</span>
        <h2 id="passion-title">Les couleurs changent tout.<br /><em>La passion ne change jamais.</em></h2>
        <p>Sur le terrain. Dans les tribunes. De génération en génération.<br />La même fierté de faire partie de l’histoire.</p>
        <a href="#top" className="club-button">Toujours plus haut. Ensemble. <span aria-hidden="true">↑</span></a>
        <span className="club-passion-watermark" aria-hidden="true">EGS</span>
      </section>

      <footer className="club-footer"><div className="club-container"><div className="club-footer-top"><Link href="/" className="club-brand"><Image src="/egs-gafsa-logo.png" alt="Écusson EGS Gafsa" width={36} height={46} /><span>EGS GAFSA<small>UNE VILLE. UN CLUB. UNE PASSION.</small></span></Link><p>Le cœur à Gafsa.<br />Le regard vers demain.</p><Link href="/login" className="club-text-link">Connexion à l’espace club <Arrow /></Link></div><div className="club-footer-bottom"><span>EL GAWAFEL SPORTIVES DE GAFSA · DEPUIS 1967</span><span>GAFSA, TUNISIE <span aria-hidden="true">↗</span></span></div></div></footer>
    </main>
  );
}
