// Interactive learning bulb
  const ideaBulb = document.getElementById("idea-bulb");

  // The bee that follows pointer or touch movement
  const cursorBee = document.getElementById("cursor-bee");

  if (cursorBee) {
    document.addEventListener("pointermove", (event) => {
      const x = event.clientX + 14;
      const y = event.clientY + 14;

      cursorBee.style.transform =
        `translate3d(${x}px, ${y}px, 0)`;

      cursorBee.classList.add("is-visible", "is-flying");
    });

    document.addEventListener("pointerleave", () => {
      cursorBee.classList.remove("is-visible");
    });

    document.addEventListener("pointerenter", () => {
      cursorBee.classList.add("is-visible");
    });
  }

  // Glow the bulb when a student submits a lesson question.
  if (form && ideaBulb) {
    form.addEventListener("submit", () => {
      ideaBulb.classList.add("is-glowing");
    });
  }
