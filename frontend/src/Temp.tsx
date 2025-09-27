import { useState } from "react";
import { Link } from "react-router-dom";

function Temp() {
  return (
    <div className=" text-3xl text-amber-200">
      <div> TEMP </div>
      <Link to="/">Go to App</Link>
    </div>
  );
}

export default Temp;
