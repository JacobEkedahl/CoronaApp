import React, { useEffect, useState } from "react";
import CardElement from "./CardElement";
import "./News.css";
let Parser = require("rss-parser");
let parser = new Parser();

const url =
  "https://www.folkhalsomyndigheten.se/nyheter-och-press/nyhetsarkiv/?topic=smittskydd-och-sjukdomar&syndication=rss";

const News = () => {
  const [articles, setArticles] = useState(null);

  useEffect(() => {
    parser.parseURL(url).then((articles) => {
      setArticles(articles.items);
    });
  }, []);

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
      {!!articles && (
        <ul className="newsComponent">
          {articles.map((article) => (
            <li>
              <CardElement article={article} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default React.memo(News);
