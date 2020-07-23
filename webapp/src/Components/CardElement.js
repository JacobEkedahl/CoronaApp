import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import React from "react";
import "./CardElement.css";

export default function CardElement({ article }) {
  const pubDate = new Date(article.pubDate);

  return (
    <Card>
      <CardContent>
        <CardActionArea onClick={() => window.open(article.link)}>
          <Typography
            style={{ marginTop: 10, textDecoration: "underline" }}
            gutterBottom
            variant="h7"
            component="h3"
          >
            {article.title}
          </Typography>
        </CardActionArea>
        <Typography variant="body2" color="textSecondary" component="p">
          <strong style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}>
            Publicerat:
          </strong>{" "}
          {addZeroIfPossible(pubDate.getDate()) +
            " " +
            monthNames[pubDate.getMonth()] +
            " " +
            pubDate.getFullYear()}
        </Typography>
        <Typography variant="body2" color="textSecondary" component="p">
          {article.contentSnippet}
        </Typography>
      </CardContent>
    </Card>
  );
}

const addZeroIfPossible = (dayOfMonth) => {
  if (dayOfMonth < 10) {
    return "0" + dayOfMonth;
  }

  return dayOfMonth;
};

const monthNames = [
  "Januari",
  "Februari",
  "Mars",
  "April",
  "Maj",
  "Juni",
  "Juli",
  "Augusti",
  "September",
  "Oktober",
  "November",
  "December",
];
