import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("GreeterModule", (m) => {
    const name = m.getParameter("greeterName", "Eugene");
    const greeter = m.contract("Greeter", [name]);

    return { greeter };
});