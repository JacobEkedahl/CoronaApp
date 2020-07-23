import React, { useEffect, useState } from "react";
import Parser from "rss-parser";
import CardElement from "./CardElement";
import Loader from "./Loader";
import "./News.css";

const CORS_PROXY = "https://cors-anywhere.herokuapp.com/";
const url =
  "https://www.folkhalsomyndigheten.se/nyheter-och-press/nyhetsarkiv/?topic=smittskydd-och-sjukdomar&syndication=rss";

const News = () => {
  const [articles, setArticles] = useState(null);
  const hasChanged = !!articles ? articles.length : 0;

  useEffect(() => {
    const parser = new Parser();
    parser.parseURL(CORS_PROXY + url).then((articles) => {
      setArticles(articles.items);
    });
  }, [hasChanged]);

  if (articles === null) {
    return <Loader />;
  }

  return (
    <>
      <h2>
        <img
          style={{ marginRight: 10 }}
          src="swedishNewsIcon.png"
          alt="Folkhälsomyndigheten"
          height="35"
          width="35"
        />
        Folkhälsomyndigheten
      </h2>
      <ul className="newsComponent">
        {articles.map((article) => (
          <li>
            <CardElement article={article} />
          </li>
        ))}
      </ul>
    </>
  );
};

export default React.memo(News);
