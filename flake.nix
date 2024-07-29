{
  description = "Simon app in react";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-23.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }@inputs:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
      in {
        devShell = pkgs.mkShell {
          buildInputs = with pkgs; [
            typescript
            nodePackages_latest.typescript-language-server
            nodePackages_latest.ts-node
            tailwindcss-language-server
            nil
          ];

          shellHook = ''
          '';
        };
        defaultPackage = pkgs.stdenv.mkDerivation {
          pname = "react-simon";
          version = "1.0.0";

          src = ./.;

          buildInputs = with pkgs; [
          ];

          buildPhase = ''
            TODO:
          '';

          installPhase = ''
            TODO:
          '';
        };
        apps.default = {
          type = "app";
          program = "TODO";
        };
      }
    );
}
